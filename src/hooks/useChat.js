import { useState, useEffect, useCallback, useRef } from 'react';
import {
  setupEncryptionSession, restoreEncryptionSession,
  encryptMessage, decryptMessage,
} from '../services/cryptoService';
import {
  initDB, saveConversation, loadConversations,
  saveMessage, loadMessages, updateMessage,
  deleteMessage as dbDeleteMessage, clearConversationMessages,
  saveKeyInfo, loadKeyInfo,
} from '../services/storageService';
import {
  generateResponse, getTypingDelay, getDeliveredDelay, getReadDelay, seedMessages,
} from '../services/simulationService';
import { generateId, getInitials, getAvatarColor, formatDate } from '../utils/helpers';

const INITIAL_CONTACTS = [
  { id: 'alice', name: 'Alice Chen', seedKey: 'alice', online: true },
  { id: 'bob', name: 'Bob Martinez', seedKey: 'bob', online: false },
  { id: 'sarah', name: 'Sarah Kim', seedKey: 'sarah', online: true },
  { id: 'david', name: 'David Park', seedKey: 'david', online: false },
];

function makeConversation(contact) {
  const [bg, text] = getAvatarColor(contact.name);
  return {
    id: contact.id, name: contact.name,
    initials: getInitials(contact.name),
    avatarBg: bg, avatarText: text,
    online: contact.online,
    lastSeen: contact.online ? null : Date.now() - Math.random() * 3600000 * 5,
    lastMessage: '', lastMessageTime: null,
    unreadCount: 0, seedKey: contact.seedKey,
    muted: false, archived: false, pinned: false,
    disappearingMessages: 0, // 0=off, seconds otherwise
  };
}

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState({});
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [typingContacts, setTypingContacts] = useState({});
  const [encryptionSessions, setEncryptionSessions] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // { convId, msg, plaintext }
  const [selectedMessages, setSelectedMessages] = useState({}); // { [convId]: Set<msgId> }
  const [starredMessages, setStarredMessages] = useState({}); // { [convId]: Set<msgId> }
  const [pinnedMessages, setPinnedMessages] = useState({}); // { [convId]: msgId | null }

  const encSessionsRef = useRef({});
  const decMsgRef = useRef({});
  const convRef = useRef([]);

  useEffect(() => { encSessionsRef.current = encryptionSessions; }, [encryptionSessions]);
  useEffect(() => { decMsgRef.current = decryptedMessages; }, [decryptedMessages]);
  useEffect(() => { convRef.current = conversations; }, [conversations]);

  // ─── Toasts ────────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ─── Decrypt helper ─────────────────────────────────────────────────────────
  const decryptAndCache = useCallback(async (convId, msg, sessions) => {
    const session = sessions[convId];
    if (!session?.encryptionKey) return '[Encrypted]';
    try {
      const plain = await decryptMessage(session.encryptionKey, msg.ciphertext, msg.iv);
      return plain;
    } catch { return '[Unable to decrypt]'; }
  }, []);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        await initDB();
        let storedConvs = await loadConversations();
        const isFirstRun = storedConvs.length === 0;
        if (isFirstRun) {
          for (const c of INITIAL_CONTACTS) { const conv = makeConversation(c); await saveConversation(conv); }
          storedConvs = INITIAL_CONTACTS.map(makeConversation);
        }
        const sessions = {};
        for (const conv of storedConvs) {
          try {
            const keyInfo = await loadKeyInfo(conv.id);
            if (keyInfo) {
              const res = await restoreEncryptionSession(keyInfo.exportedKeys, keyInfo.salt);
              sessions[conv.id] = res;
            } else {
              const session = await setupEncryptionSession();
              await saveKeyInfo(conv.id, { exportedKeys: session.exportedKeys, salt: session.salt });
              sessions[conv.id] = { encryptionKey: session.encryptionKey, myFingerprint: session.myFingerprint, peerFingerprint: session.peerFingerprint };
            }
          } catch (err) { console.error('Session error', conv.id, err); }
        }
        setEncryptionSessions(sessions);
        encSessionsRef.current = sessions;

        const allMessages = {};
        const allDecrypted = {};
        for (const conv of storedConvs) {
          const msgs = await loadMessages(conv.id);
          allMessages[conv.id] = msgs;
          allDecrypted[conv.id] = {};
          if (sessions[conv.id]?.encryptionKey) {
            for (const msg of msgs) {
              try {
                allDecrypted[conv.id][msg.id] = await decryptMessage(sessions[conv.id].encryptionKey, msg.ciphertext, msg.iv);
              } catch { allDecrypted[conv.id][msg.id] = '[Unable to decrypt]'; }
            }
          }
        }
        setDecryptedMessages(allDecrypted);
        decMsgRef.current = allDecrypted;

        if (isFirstRun) {
          for (const conv of storedConvs) {
            const seeds = seedMessages[conv.seedKey] || [];
            const session = sessions[conv.id];
            if (!session?.encryptionKey) continue;
            let baseTime = Date.now() - seeds.length * 120000 - 300000;
            for (const seed of seeds) {
              const id = generateId(); const ts = baseTime; baseTime += 60000 + Math.random() * 120000;
              const { ciphertext, iv } = await encryptMessage(session.encryptionKey, seed.text);
              const msg = { id, conversationId: conv.id, ciphertext, iv, senderId: seed.from === 'me' ? 'me' : conv.id, timestamp: ts, status: 'read', reactions: {}, replyTo: null, starred: false, pinned: false, deletedForMe: false, deletedForEveryone: false, isForwarded: false, isVoice: false };
              await saveMessage(msg);
              allMessages[conv.id] = [...(allMessages[conv.id] || []), msg];
              allDecrypted[conv.id][id] = seed.text;
            }
          }
          setDecryptedMessages({ ...allDecrypted });
          decMsgRef.current = { ...allDecrypted };
        }

        setMessages(allMessages);
        const updatedConvs = storedConvs.map(conv => {
          const msgs = allMessages[conv.id] || [];
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            return { ...conv, lastMessage: allDecrypted[conv.id]?.[last.id] || '[Encrypted]', lastMessageTime: last.timestamp };
          }
          return conv;
        });
        setConversations(updatedConvs);

        // Restore starred/pinned from messages
        const starred = {}, pinned = {};
        for (const conv of storedConvs) {
          starred[conv.id] = new Set((allMessages[conv.id] || []).filter(m => m.starred).map(m => m.id));
          const pinnedMsg = (allMessages[conv.id] || []).find(m => m.pinned);
          pinned[conv.id] = pinnedMsg?.id || null;
        }
        setStarredMessages(starred);
        setPinnedMessages(pinned);
        setIsInitialized(true);
      } catch (err) {
        console.error('Init error:', err);
        addToast('Failed to initialize. Please refresh.', 'error');
        setIsInitialized(true);
      }
    }
    init();
  }, [addToast]);

  // ─── Select Conversation ───────────────────────────────────────────────────
  const selectConversation = useCallback((convId) => {
    setActiveConversationId(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
  }, []);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (convId, text, options = {}) => {
    const session = encSessionsRef.current[convId];
    if (!session?.encryptionKey) { addToast('Encryption not ready.', 'error'); return; }
    try {
      const { ciphertext, iv } = await encryptMessage(session.encryptionKey, text);
      const msgId = generateId(); const timestamp = Date.now();
      const msg = {
        id: msgId, conversationId: convId, ciphertext, iv,
        senderId: 'me', timestamp, status: 'sent',
        reactions: {}, replyTo: options.replyTo || null,
        starred: false, pinned: false, deletedForMe: false, deletedForEveryone: false,
        isForwarded: options.isForwarded || false, isVoice: options.isVoice || false,
        voiceDuration: options.voiceDuration || 0,
      };
      await saveMessage(msg);
      setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), msg] }));
      setDecryptedMessages(prev => ({ ...prev, [convId]: { ...(prev[convId] || {}), [msgId]: text } }));
      decMsgRef.current = { ...decMsgRef.current, [convId]: { ...(decMsgRef.current[convId] || {}), [msgId]: text } };
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, lastMessage: options.isVoice ? '🎤 Voice message' : text, lastMessageTime: timestamp } : c));

      // Delivered
      setTimeout(async () => {
        const delivered = { ...msg, status: 'delivered' };
        await updateMessage(delivered);
        setMessages(prev => ({ ...prev, [convId]: (prev[convId] || []).map(m => m.id === msgId ? { ...m, status: 'delivered' } : m) }));
        // Typing
        setTimeout(() => setTypingContacts(prev => ({ ...prev, [convId]: true })), 300);
        const delay = getTypingDelay();
        setTimeout(async () => {
          setTypingContacts(prev => ({ ...prev, [convId]: false }));
          const conv = convRef.current.find(c => c.id === convId) || { name: 'Contact' };
          const responseText = await generateResponse(options.isVoice ? '[voice message]' : text, conv.name);
          const responseId = generateId(); const responseTs = Date.now();
          const { ciphertext: rc, iv: riv } = await encryptMessage(session.encryptionKey, responseText);
          const responseMsg = { id: responseId, conversationId: convId, ciphertext: rc, iv: riv, senderId: convId, timestamp: responseTs, status: 'read', reactions: {}, replyTo: null, starred: false, pinned: false, deletedForMe: false, deletedForEveryone: false, isForwarded: false, isVoice: false };
          await saveMessage(responseMsg);
          setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), responseMsg] }));
          setDecryptedMessages(prev => ({ ...prev, [convId]: { ...(prev[convId] || {}), [responseId]: responseText } }));
          decMsgRef.current = { ...decMsgRef.current, [convId]: { ...(decMsgRef.current[convId] || {}), [responseId]: responseText } };
          setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            const isActive = c.id === convId;
            return { ...c, lastMessage: responseText, lastMessageTime: responseTs, unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1 };
          }));
          setTimeout(async () => {
            const readMsg = { ...msg, status: 'read' };
            await updateMessage(readMsg);
            setMessages(prev => ({ ...prev, [convId]: (prev[convId] || []).map(m => m.id === msgId ? { ...m, status: 'read' } : m) }));
          }, getReadDelay());
        }, delay);
      }, getDeliveredDelay());
    } catch (err) { console.error('Send error:', err); addToast('Failed to send message.', 'error'); }
  }, [addToast]);

  // ─── React to Message ──────────────────────────────────────────────────────
  const reactToMessage = useCallback(async (convId, msgId, emoji) => {
    setMessages(prev => {
      const msgs = (prev[convId] || []).map(m => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (reactions[emoji]) {
          delete reactions[emoji];
        } else {
          // Remove any existing reaction from 'me' first
          Object.keys(reactions).forEach(e => { if (reactions[e] === 'me') delete reactions[e]; });
          reactions[emoji] = 'me';
        }
        const updated = { ...m, reactions };
        updateMessage(updated);
        return updated;
      });
      return { ...prev, [convId]: msgs };
    });
  }, []);

  // ─── Star Message ──────────────────────────────────────────────────────────
  const starMessage = useCallback(async (convId, msgId) => {
    setMessages(prev => {
      const msgs = (prev[convId] || []).map(m => {
        if (m.id !== msgId) return m;
        const updated = { ...m, starred: !m.starred };
        updateMessage(updated);
        return updated;
      });
      return { ...prev, [convId]: msgs };
    });
    setStarredMessages(prev => {
      const set = new Set(prev[convId] || []);
      if (set.has(msgId)) { set.delete(msgId); addToast('Message unstarred', 'info'); }
      else { set.add(msgId); addToast('Message starred ⭐', 'success'); }
      return { ...prev, [convId]: set };
    });
  }, [addToast]);

  // ─── Pin Message ───────────────────────────────────────────────────────────
  const pinMessage = useCallback(async (convId, msgId) => {
    const current = pinnedMessages[convId];
    const newPinned = current === msgId ? null : msgId;
    // Unpin old
    if (current) {
      setMessages(prev => {
        const msgs = (prev[convId] || []).map(m => {
          if (m.id !== current) return m;
          const u = { ...m, pinned: false }; updateMessage(u); return u;
        });
        return { ...prev, [convId]: msgs };
      });
    }
    // Pin new
    if (newPinned) {
      setMessages(prev => {
        const msgs = (prev[convId] || []).map(m => {
          if (m.id !== newPinned) return m;
          const u = { ...m, pinned: true }; updateMessage(u); return u;
        });
        return { ...prev, [convId]: msgs };
      });
      addToast('Message pinned 📌', 'success');
    } else {
      addToast('Message unpinned', 'info');
    }
    setPinnedMessages(prev => ({ ...prev, [convId]: newPinned }));
  }, [pinnedMessages, addToast]);

  // ─── Delete Message ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (convId, msgId, deleteForEveryone = false) => {
    if (deleteForEveryone) {
      setMessages(prev => {
        const msgs = (prev[convId] || []).map(m => {
          if (m.id !== msgId) return m;
          const u = { ...m, deletedForEveryone: true, ciphertext: '', iv: '' }; updateMessage(u); return u;
        });
        return { ...prev, [convId]: msgs };
      });
      setDecryptedMessages(prev => ({ ...prev, [convId]: { ...(prev[convId] || {}), [msgId]: null } }));
      addToast('Message deleted for everyone', 'info');
    } else {
      setMessages(prev => {
        const msgs = (prev[convId] || []).map(m => {
          if (m.id !== msgId) return m;
          const u = { ...m, deletedForMe: true }; updateMessage(u); return u;
        });
        return { ...prev, [convId]: msgs };
      });
      addToast('Message deleted', 'info');
    }
  }, [addToast]);

  // ─── Forward Message ───────────────────────────────────────────────────────
  const forwardMessage = useCallback(async (fromConvId, msgId, toConvIds) => {
    const plaintext = decMsgRef.current[fromConvId]?.[msgId];
    if (!plaintext) { addToast('Cannot forward encrypted message.', 'error'); return; }
    for (const toConvId of toConvIds) {
      await sendMessage(toConvId, plaintext, { isForwarded: true });
    }
    addToast(`Forwarded to ${toConvIds.length} chat${toConvIds.length > 1 ? 's' : ''}`, 'success');
  }, [sendMessage, addToast]);

  // ─── Select/Deselect Messages ──────────────────────────────────────────────
  const toggleSelectMessage = useCallback((convId, msgId) => {
    setSelectedMessages(prev => {
      const set = new Set(prev[convId] || []);
      if (set.has(msgId)) set.delete(msgId); else set.add(msgId);
      return { ...prev, [convId]: set };
    });
  }, []);
  const clearSelection = useCallback((convId) => {
    setSelectedMessages(prev => ({ ...prev, [convId]: new Set() }));
  }, []);
  const deleteSelectedMessages = useCallback(async (convId) => {
    const ids = [...(selectedMessages[convId] || [])];
    for (const id of ids) await deleteMessage(convId, id, false);
    clearSelection(convId);
  }, [selectedMessages, deleteMessage, clearSelection]);

  // ─── Reply ─────────────────────────────────────────────────────────────────
  const setReply = useCallback((convId, msg, plaintext) => {
    setReplyingTo({ convId, msg, plaintext });
  }, []);
  const clearReply = useCallback(() => setReplyingTo(null), []);

  // ─── Mute / Archive / Pin Conversation ────────────────────────────────────
  const muteConversation = useCallback(async (convId) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const updated = { ...c, muted: !c.muted };
      saveConversation(updated);
      addToast(updated.muted ? 'Conversation muted 🔕' : 'Conversation unmuted 🔔', 'info');
      return updated;
    }));
  }, [addToast]);

  const archiveConversation = useCallback(async (convId) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const updated = { ...c, archived: !c.archived };
      saveConversation(updated);
      addToast(updated.archived ? 'Conversation archived' : 'Conversation unarchived', 'info');
      return updated;
    }));
  }, [addToast]);

  const pinConversation = useCallback(async (convId) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const updated = { ...c, pinned: !c.pinned };
      saveConversation(updated);
      return updated;
    }));
  }, []);

  // ─── Disappearing Messages ─────────────────────────────────────────────────
  const setDisappearingMessages = useCallback(async (convId, duration) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const updated = { ...c, disappearingMessages: duration };
      saveConversation(updated);
      addToast(duration === 0 ? 'Disappearing messages off' : `Messages disappear after ${duration}s`, 'info');
      return updated;
    }));
  }, [addToast]);

  // ─── Clear Conversation ────────────────────────────────────────────────────
  const clearConversation = useCallback(async (convId) => {
    try {
      await clearConversationMessages(convId);
      setMessages(prev => ({ ...prev, [convId]: [] }));
      setDecryptedMessages(prev => ({ ...prev, [convId]: {} }));
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, lastMessage: '', lastMessageTime: null, unreadCount: 0 } : c));
      setPinnedMessages(prev => ({ ...prev, [convId]: null }));
      setStarredMessages(prev => ({ ...prev, [convId]: new Set() }));
      addToast('Conversation cleared.', 'success');
    } catch (err) { addToast('Failed to clear.', 'error'); }
  }, [addToast]);

  // ─── Create Conversation ───────────────────────────────────────────────────
  const createConversation = useCallback(async (name) => {
    const id = generateId();
    const [bg, text] = getAvatarColor(name);
    const conv = { id, name, initials: getInitials(name), avatarBg: bg, avatarText: text, online: Math.random() > 0.5, lastSeen: null, lastMessage: '', lastMessageTime: null, unreadCount: 0, seedKey: null, muted: false, archived: false, pinned: false, disappearingMessages: 0 };
    try {
      const session = await setupEncryptionSession();
      await saveKeyInfo(id, { exportedKeys: session.exportedKeys, salt: session.salt });
      await saveConversation(conv);
      setConversations(prev => [conv, ...prev]);
      setMessages(prev => ({ ...prev, [id]: [] }));
      setDecryptedMessages(prev => ({ ...prev, [id]: {} }));
      setEncryptionSessions(prev => { const next = { ...prev, [id]: { encryptionKey: session.encryptionKey, myFingerprint: session.myFingerprint, peerFingerprint: session.peerFingerprint } }; encSessionsRef.current = next; return next; });
      addToast(`Conversation with ${name} created.`, 'success');
      return id;
    } catch (err) { addToast('Failed to create conversation.', 'error'); return null; }
  }, [addToast]);

  return {
    conversations, activeConversationId, messages, decryptedMessages,
    typingContacts, encryptionSessions, isInitialized, toasts,
    replyingTo, selectedMessages, starredMessages, pinnedMessages,
    sendMessage, selectConversation, createConversation, clearConversation,
    deleteMessage, reactToMessage, starMessage, pinMessage, forwardMessage,
    toggleSelectMessage, clearSelection, deleteSelectedMessages,
    setReply, clearReply,
    muteConversation, archiveConversation, pinConversation,
    setDisappearingMessages,
    removeToast, addToast,
  };
}
