import React, { useState, useRef, useEffect } from 'react';
import './ChatHeader.css';

export default function ChatHeader({
  conversation, encryptionSession, onShowInfo, onShowEncryption,
  onBack, showInfoPanel, onVoiceCall, onVideoCall, onSearch, isSearching,
  onMute, onArchive, onDisappearing, onShowStarred,
}) {
  const [showMore, setShowMore] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!showMore) return;
    const handler = (e) => { if (!moreRef.current?.contains(e.target)) setShowMore(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  const isOnline = conversation?.online;

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <button className="chat-back-btn icon-btn-h" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="chat-header-contact">
          {conversation && (
            <div className="ch-avatar" style={{ background: `linear-gradient(135deg, ${conversation.avatarBg}, ${conversation.avatarText})` }}>
              {conversation.initials}
              <span className={`ch-status-dot ${isOnline ? 'online' : 'offline'}`} />
            </div>
          )}
          <div className="chat-header-info">
            <span className="chat-header-name">{conversation?.name || 'Select a conversation'}</span>
            {conversation && (
              <span className={`chat-header-status ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? '● Online' : '○ Last seen recently'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="chat-header-right">
        {encryptionSession && (
          <button className="enc-badge" onClick={onShowEncryption} title="Encryption details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Encrypted</span>
          </button>
        )}

        {conversation && (
          <>
            <button className="icon-btn-h" onClick={onVoiceCall} title="Voice call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.18-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <button className="icon-btn-h" onClick={onVideoCall} title="Video call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
            <button className={`icon-btn-h ${isSearching ? 'active' : ''}`} onClick={onSearch} title="Search messages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </>
        )}

        <button className={`icon-btn-h ${showInfoPanel ? 'active' : ''}`} onClick={onShowInfo} title="Conversation info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>

        {conversation && (
          <div className="more-menu-wrapper" ref={moreRef}>
            <button className="icon-btn-h" onClick={() => setShowMore(p => !p)} title="More options">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
            {showMore && (
              <div className="more-dropdown">
                <button className="more-item" onClick={() => { onShowStarred(); setShowMore(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Starred Messages
                </button>
                <button className="more-item" onClick={() => { onMute(); setShowMore(false); }}>
                  {conversation.muted ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  )}
                  {conversation.muted ? 'Unmute' : 'Mute'}
                </button>
                <button className="more-item" onClick={() => { setShowDisappearing(p => !p); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Disappearing Messages
                </button>
                {showDisappearing && (
                  <div className="disappearing-submenu">
                    {[
                      { label: 'Off', value: 0 },
                      { label: '24 hours', value: 86400 },
                      { label: '7 days', value: 604800 },
                      { label: '90 days', value: 7776000 },
                    ].map(opt => (
                      <button key={opt.value} className="more-item sub-item" onClick={() => { onDisappearing(opt.value); setShowMore(false); setShowDisappearing(false); }}>
                        {conversation.disappearingMessages === opt.value ? '✓ ' : ''}{opt.label}
                      </button>
                    ))}
                  </div>
                )}
                <button className="more-item" onClick={() => { onArchive(); setShowMore(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  {conversation.archived ? 'Unarchive' : 'Archive'}
                </button>
                <div className="more-divider" />
                <button className="more-item danger" onClick={() => { onShowEncryption(); setShowMore(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Encryption Details
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
