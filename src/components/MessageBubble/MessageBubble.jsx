import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MessageBubble.css';
import { formatTime } from '../../utils/helpers';
import { ReactionBar } from '../EmojiPicker/EmojiPicker';

function StatusTicks({ status }) {
  if (status === 'sent') return (
    <span className="ticks sent" title="Sent">
      <svg viewBox="0 0 16 11" fill="none"><path d="M1 5.5L5 9.5L15 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
  if (status === 'delivered') return (
    <span className="ticks delivered" title="Delivered">
      <svg viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5.5L11 9.5L19 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
  if (status === 'read') return (
    <span className="ticks read" title="Read">
      <svg viewBox="0 0 20 11" fill="none"><path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5.5L11 9.5L19 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
  return null;
}

function VoiceMessage({ duration = 0, isMine }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const totalDuration = duration || Math.floor(Math.random() * 30) + 5;

  const togglePlay = () => {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(intervalRef.current); setPlaying(false); return 0; }
          return p + (100 / (totalDuration * 10));
        });
      }, 100);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const formatDur = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const bars = Array.from({ length: 28 }, (_, i) => ({
    height: 20 + Math.sin(i * 0.8) * 12 + Math.random() * 8,
    filled: (i / 28) * 100 < progress,
  }));

  return (
    <div className="voice-message">
      <button className="voice-play-btn" onClick={togglePlay}>
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <div className="voice-waveform">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`voice-bar ${bar.filled ? 'filled' : ''}`}
            style={{ height: bar.height }}
          />
        ))}
      </div>
      <span className="voice-duration">{formatDur(playing ? Math.floor((progress / 100) * totalDuration) : totalDuration)}</span>
    </div>
  );
}

export default function MessageBubble({
  message, plaintext, isMine, contactName, contactInitials, avatarBg, avatarText,
  onDelete, onReact, onReply, onForward, onStar, onPin, isSelected, onSelect,
  selectionMode, replySourceText,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef(null);

  const isDeleted = message.deletedForEveryone || message.deletedForMe;
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions);

  const handleContextMenu = useCallback((e) => {
    if (selectionMode) return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    setMenuPos({ x, y });
    setShowMenu(true);
    setShowReactionBar(false);
  }, [selectionMode]);

  const closeAll = useCallback(() => { setShowMenu(false); setShowReactionBar(false); }, []);

  useEffect(() => {
    if (showMenu || showReactionBar) {
      const handler = (e) => { if (!wrapperRef.current?.contains(e.target)) closeAll(); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showMenu, showReactionBar, closeAll]);

  const handleClick = () => { if (selectionMode) onSelect(message.id); };

  const handleSwipe = () => { if (!selectionMode && !isDeleted) onReply(); };

  return (
    <div
      ref={wrapperRef}
      className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'} ${isSelected ? 'selected' : ''} ${selectionMode ? 'selection-mode' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={`msg-checkbox ${isSelected ? 'checked' : ''}`}>
          {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      )}

      {/* Avatar for received messages */}
      {!isMine && (
        <div className="msg-avatar" style={{ background: `linear-gradient(135deg, ${avatarBg}, ${avatarText})` }}>
          {contactInitials}
        </div>
      )}

      <div className="msg-column">
        {/* Bubble */}
        <div className={`message-bubble ${isMine ? 'sent' : 'received'} ${isDeleted ? 'deleted' : ''}`}>
          {/* Forwarded badge */}
          {message.isForwarded && !isDeleted && (
            <div className="forwarded-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>
              </svg>
              Forwarded
            </div>
          )}

          {/* Reply preview */}
          {message.replyTo && !isDeleted && (
            <div className="reply-preview">
              <div className="reply-bar" />
              <div className="reply-content">
                <span className="reply-author">{message.replyTo.senderId === 'me' ? 'You' : contactName}</span>
                <span className="reply-text">{message.replyTo.text}</span>
              </div>
            </div>
          )}

          {/* Starred badge */}
          {message.starred && !isDeleted && (
            <div className="starred-badge">⭐</div>
          )}

          {/* Message body */}
          {isDeleted ? (
            <div className="deleted-msg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
              </svg>
              {message.deletedForEveryone ? 'This message was deleted' : 'You deleted this message'}
            </div>
          ) : message.isVoice ? (
            <VoiceMessage duration={message.voiceDuration} isMine={isMine} />
          ) : (
            <div className="message-text">
              {plaintext || (
                <span className="encrypted-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Encrypted
                </span>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="message-meta">
            {message.pinned && <span className="pin-icon" title="Pinned">📌</span>}
            <span className="message-time">{formatTime(message.timestamp)}</span>
            {isMine && !isDeleted && <StatusTicks status={message.status} />}
          </div>
        </div>

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className={`reactions-row ${isMine ? 'reactions-mine' : 'reactions-theirs'}`}>
            {reactionEntries.map(([emoji]) => (
              <button
                key={emoji}
                className="reaction-chip"
                onClick={() => onReact(emoji)}
                title="Remove reaction"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Quick react on hover */}
        {!isDeleted && !selectionMode && (
          <div className={`quick-actions ${isMine ? 'quick-mine' : 'quick-theirs'}`}>
            <button className="quick-btn" title="React" onClick={() => setShowReactionBar(p => !p)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            <button className="quick-btn" title="Reply" onClick={handleSwipe}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
            </button>
          </div>
        )}

        {/* Reaction bar */}
        {showReactionBar && (
          <div className={`reaction-bar-pos ${isMine ? 'rbar-mine' : 'rbar-theirs'}`}>
            <ReactionBar onReact={(emoji) => onReact(emoji)} onClose={() => setShowReactionBar(false)} />
          </div>
        )}
      </div>

      {/* Context menu */}
      {showMenu && (
        <div className="context-menu" style={{ left: menuPos.x, top: menuPos.y }} onClick={e => e.stopPropagation()}>
          {!isDeleted && (
            <>
              <button className="context-item" onClick={() => { onReply(); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                Reply
              </button>
              <button className="context-item" onClick={() => { setShowReactionBar(true); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                React
              </button>
              <button className="context-item" onClick={() => { onForward(); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
                Forward
              </button>
              <button className="context-item" onClick={() => { navigator.clipboard?.writeText(plaintext || ''); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button className="context-item" onClick={() => { onStar(); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill={message.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {message.starred ? 'Unstar' : 'Star'}
              </button>
              <button className="context-item" onClick={() => { onPin(); closeAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>
                {message.pinned ? 'Unpin' : 'Pin'}
              </button>
              <div className="context-divider" />
            </>
          )}
          <button className="context-item" onClick={() => { onSelect(message.id); closeAll(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Select
          </button>
          <button className="context-item delete" onClick={() => { onDelete(message.id, false); closeAll(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete for me
          </button>
          {isMine && (
            <button className="context-item delete" onClick={() => { onDelete(message.id, true); closeAll(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
