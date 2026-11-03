import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ChatWindow.css';
import ChatHeader from '../ChatHeader/ChatHeader';
import MessageBubble from '../MessageBubble/MessageBubble';
import MessageInput from '../MessageInput/MessageInput';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import EmptyState from '../EmptyState/EmptyState';
import ForwardModal from '../ForwardModal/ForwardModal';
import { formatFullDate, highlightText } from '../../utils/helpers';

function DateDivider({ timestamp }) {
  const date = new Date(timestamp), now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  return <div className="date-divider"><span>{label}</span></div>;
}

function groupMessagesByDate(messages) {
  const groups = []; let lastDate = null;
  for (const msg of messages) {
    const d = new Date(msg.timestamp).toDateString();
    if (d !== lastDate) { groups.push({ type: 'date', timestamp: msg.timestamp, key: `date-${msg.timestamp}-${msg.id}` }); lastDate = d; }
    groups.push({ type: 'message', msg, key: msg.id });
  }
  return groups;
}

export default function ChatWindow({
  conversation, messages, decryptedMessages, typingContacts, encryptionSession,
  conversations, onSend, onDelete, onReact, onReply, onStar, onPin, onForward,
  onShowInfo, onShowEncryption, onBack, showInfoPanel,
  onVoiceCall, onVideoCall,
  onMute, onArchive, onDisappearing, onShowStarred,
  replyingTo, onCancelReply,
  selectedMessages, onSelectMessage, onClearSelection, onDeleteSelected,
}) {
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwardingMsgId, setForwardingMsgId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx, setSearchIdx] = useState(0);

  const convId = conversation?.id;
  const convMessages = (messages[convId] || []).filter(m => !m.deletedForMe);
  const convDecrypted = decryptedMessages[convId] || {};
  const isTyping = typingContacts[convId] || false;
  const convSelected = selectedMessages[convId] || new Set();
  const selectionMode = convSelected.size > 0;

  const pinnedMsg = convMessages.find(m => m.pinned);
  const pinnedText = pinnedMsg ? convDecrypted[pinnedMsg.id] : null;

  // Auto-scroll
  useEffect(() => {
    if (!isSearching) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length, isTyping, isSearching]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim() || !convId) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = [];
    convMessages.forEach((msg, idx) => {
      const plain = convDecrypted[msg.id];
      if (plain?.toLowerCase().includes(q)) results.push({ msgId: msg.id, idx });
    });
    setSearchResults(results);
    setSearchIdx(results.length > 0 ? results.length - 1 : 0);
  }, [searchQuery, convId]);

  const scrollToResult = useCallback((result) => {
    if (!result) return;
    const el = document.getElementById(`msg-${result.msgId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  useEffect(() => { if (searchResults.length > 0) scrollToResult(searchResults[searchIdx]); }, [searchIdx, searchResults]);

  const handleReply = useCallback((msg) => {
    onReply(convId, msg, convDecrypted[msg.id]);
  }, [convId, onReply, convDecrypted]);

  const handleForward = useCallback((msgId) => setForwardingMsgId(msgId), []);

  const handleToggleSearch = useCallback(() => {
    setIsSearching(p => !p);
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  if (!conversation) return <main className="chat-window"><EmptyState /></main>;

  const groups = groupMessagesByDate(convMessages);

  return (
    <main className="chat-window">
      <ChatHeader
        conversation={conversation}
        encryptionSession={encryptionSession}
        onShowInfo={onShowInfo}
        onShowEncryption={onShowEncryption}
        onBack={onBack}
        showInfoPanel={showInfoPanel}
        onVoiceCall={onVoiceCall}
        onVideoCall={onVideoCall}
        onSearch={handleToggleSearch}
        isSearching={isSearching}
        onMute={onMute}
        onArchive={onArchive}
        onDisappearing={onDisappearing}
        onShowStarred={onShowStarred}
      />

      {/* In-chat Search bar */}
      {isSearching && (
        <div className="in-chat-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={searchInputRef}
            className="in-chat-search-input"
            placeholder="Search in conversation…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <span className="search-count">{searchIdx + 1}/{searchResults.length}</span>
          )}
          <div className="search-nav">
            <button onClick={() => setSearchIdx(i => Math.max(0, i - 1))} disabled={searchIdx === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button onClick={() => setSearchIdx(i => Math.min(searchResults.length - 1, i + 1))} disabled={searchIdx >= searchResults.length - 1}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <button className="search-close-btn" onClick={() => { setIsSearching(false); setSearchQuery(''); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Pinned message */}
      {pinnedMsg && pinnedText && !isSearching && (
        <div className="pinned-banner" onClick={() => { const el = document.getElementById(`msg-${pinnedMsg.id}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
          <div className="pinned-accent" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pin-svg"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>
          <div className="pinned-content">
            <span className="pinned-label">Pinned Message</span>
            <span className="pinned-text">{pinnedText}</span>
          </div>
        </div>
      )}

      {/* Selection bar */}
      {selectionMode && (
        <div className="selection-bar">
          <span className="sel-count">{convSelected.size} selected</span>
          <div className="sel-actions">
            <button className="sel-btn" onClick={() => {
              const id = [...convSelected][0];
              if (id) handleForward(id);
            }} title="Forward">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
            </button>
            <button className="sel-btn danger" onClick={onDeleteSelected} title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
            <button className="sel-btn" onClick={onClearSelection} title="Cancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-list" ref={listRef}>
        {convMessages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p>No messages yet. Say hello! 👋</p>
            <p className="empty-chat-sub">All messages encrypted with AES-GCM 256-bit</p>
          </div>
        ) : (
          groups.map(item =>
            item.type === 'date' ? (
              <DateDivider key={item.key} timestamp={item.timestamp} />
            ) : (
              <div
                key={item.key}
                id={`msg-${item.msg.id}`}
                className={searchResults.some(r => r.msgId === item.msg.id) && searchResults[searchIdx]?.msgId === item.msg.id ? 'search-highlight-msg' : ''}
              >
                <MessageBubble
                  message={item.msg}
                  plaintext={
                    searchQuery && convDecrypted[item.msg.id]
                      ? convDecrypted[item.msg.id]
                      : convDecrypted[item.msg.id]
                  }
                  isMine={item.msg.senderId === 'me'}
                  contactName={conversation.name}
                  contactInitials={conversation.initials}
                  avatarBg={conversation.avatarBg}
                  avatarText={conversation.avatarText}
                  onDelete={(msgId, forEveryone) => onDelete(convId, msgId, forEveryone)}
                  onReact={(emoji) => onReact(convId, item.msg.id, emoji)}
                  onReply={() => handleReply(item.msg)}
                  onForward={() => handleForward(item.msg.id)}
                  onStar={() => onStar(convId, item.msg.id)}
                  onPin={() => onPin(convId, item.msg.id)}
                  isSelected={convSelected.has(item.msg.id)}
                  onSelect={(msgId) => onSelectMessage(convId, msgId)}
                  selectionMode={selectionMode}
                />
              </div>
            )
          )
        )}
        {isTyping && <TypingIndicator conversation={conversation} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={(text, opts) => onSend(convId, text, opts)}
        disabled={!encryptionSession}
        replyingTo={replyingTo?.convId === convId ? replyingTo : null}
        onCancelReply={onCancelReply}
        contactName={conversation.name}
      />

      {/* Forward Modal */}
      {forwardingMsgId && (
        <ForwardModal
          conversations={conversations}
          activeConvId={convId}
          onForward={(toConvIds) => onForward(convId, forwardingMsgId, toConvIds)}
          onClose={() => setForwardingMsgId(null)}
        />
      )}
    </main>
  );
}
