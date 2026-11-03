import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import { formatDate, truncate, highlightText } from '../../utils/helpers';

function Avatar({ name, initials, bg, color, size = 40, online }) {
  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <div className="avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, ${bg}, ${color})`, fontSize: size * 0.38 }}>
        {initials}
      </div>
      {online !== undefined && <span className={`avatar-status ${online ? 'online' : 'offline'}`} />}
    </div>
  );
}

export default function Sidebar({
  conversations, activeConversationId, decryptedMessages, messages,
  onSelectConversation, onNewConversation, currentUser, theme, onToggleTheme,
  onMute, onArchive, onPin, onClear,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { convId, x, y }
  const contextRef = useRef(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e) => { if (!contextRef.current?.contains(e.target)) setContextMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  const getPreview = (conv) => {
    const msgs = messages[conv.id] || [];
    if (msgs.length === 0) return 'No messages yet';
    const last = msgs[msgs.length - 1];
    if (last.deletedForEveryone) return '🚫 This message was deleted';
    if (last.isVoice) return '🎤 Voice message';
    const plain = decryptedMessages[conv.id]?.[last.id];
    if (!plain) return '🔒 Encrypted message';
    const prefix = last.senderId === 'me' ? 'You: ' : '';
    return prefix + truncate(plain, 42);
  };

  const activeConvs = conversations
    .filter(c => !c.archived && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });

  const archivedConvs = conversations.filter(c => c.archived);

  const handleContextMenu = (e, convId) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ convId, x, y });
  };

  const ctxConv = conversations.find(c => c.id === contextMenu?.convId);

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z" fill="currentColor" opacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">CipherChat</span>
            <span className="logo-badge">E2E Encrypted</span>
          </div>
        </div>
        <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      {/* Profile */}
      <div className="sidebar-profile">
        <Avatar name={currentUser.name} initials={currentUser.initials} bg="#7c3aed" color="#a78bfa" size={42} online={true} />
        <div className="profile-info">
          <span className="profile-name">{currentUser.name}</span>
          <span className="profile-status"><span className="status-dot online" />Active now</span>
        </div>
        <button className="icon-btn new-chat-btn" onClick={onNewConversation} title="New conversation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" placeholder="Search conversations…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="conversations-label">
        <span>Messages</span>
        {archivedConvs.length > 0 && (
          <button className="archived-toggle" onClick={() => setShowArchived(p => !p)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            {archivedConvs.length}
          </button>
        )}
      </div>

      <div className="conversations-list">
        {activeConvs.length === 0 && !showArchived ? (
          <div className="no-conversations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>No conversations found</span>
          </div>
        ) : (
          <>
            {activeConvs.map(conv => (
              <button
                key={conv.id}
                className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
                onContextMenu={e => handleContextMenu(e, conv.id)}
              >
                <Avatar name={conv.name} initials={conv.initials} bg={conv.avatarBg} color={conv.avatarText} size={46} online={conv.online} />
                <div className="conversation-info">
                  <div className="conversation-top">
                    <div className="conv-name-row">
                      {conv.pinned && <span className="conv-pin-icon">📌</span>}
                      <span className="conversation-name" dangerouslySetInnerHTML={{ __html: highlightText(conv.name, searchQuery) }} />
                    </div>
                    <span className="conversation-time">{conv.lastMessageTime ? formatDate(conv.lastMessageTime) : ''}</span>
                  </div>
                  <div className="conversation-bottom">
                    <span className="conversation-preview">{getPreview(conv)}</span>
                    <div className="conv-badges">
                      {conv.muted && (
                        <span className="muted-icon" title="Muted">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className={`unread-badge ${conv.muted ? 'muted' : ''}`}>
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Archived section */}
            {showArchived && archivedConvs.length > 0 && (
              <>
                <div className="archived-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  Archived
                </div>
                {archivedConvs.map(conv => (
                  <button
                    key={conv.id}
                    className={`conversation-item archived-item ${activeConversationId === conv.id ? 'active' : ''}`}
                    onClick={() => onSelectConversation(conv.id)}
                    onContextMenu={e => handleContextMenu(e, conv.id)}
                  >
                    <Avatar name={conv.name} initials={conv.initials} bg={conv.avatarBg} color={conv.avatarText} size={44} online={conv.online} />
                    <div className="conversation-info">
                      <div className="conversation-top">
                        <span className="conversation-name">{conv.name}</span>
                        <span className="conversation-time">{conv.lastMessageTime ? formatDate(conv.lastMessageTime) : ''}</span>
                      </div>
                      <div className="conversation-bottom">
                        <span className="conversation-preview">{getPreview(conv)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && ctxConv && (
        <div ref={contextRef} className="sidebar-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button className="ctx-item" onClick={() => { onPin(ctxConv.id); setContextMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>
            {ctxConv.pinned ? 'Unpin Chat' : 'Pin Chat'}
          </button>
          <button className="ctx-item" onClick={() => { onMute(ctxConv.id); setContextMenu(null); }}>
            {ctxConv.muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
            {ctxConv.muted ? 'Unmute' : 'Mute'}
          </button>
          <button className="ctx-item" onClick={() => { onArchive(ctxConv.id); setContextMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            {ctxConv.archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="ctx-divider" />
          <button className="ctx-item danger" onClick={() => { onClear(ctxConv.id); setContextMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Clear Chat
          </button>
        </div>
      )}
    </aside>
  );
}
