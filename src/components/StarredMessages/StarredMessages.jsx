import React from 'react';
import './StarredMessages.css';
import { formatFullDate } from '../../utils/helpers';

export default function StarredMessages({ conversations, messages, decryptedMessages, starredMessages, onClose, onGoToMessage, onUnstar }) {
  const allStarred = [];

  for (const conv of conversations) {
    const starred = starredMessages[conv.id] || new Set();
    const convMsgs = messages[conv.id] || [];
    const convDecrypted = decryptedMessages[conv.id] || {};

    for (const msgId of starred) {
      const msg = convMsgs.find(m => m.id === msgId);
      if (msg && !msg.deletedForMe && !msg.deletedForEveryone) {
        allStarred.push({
          msg,
          conv,
          plaintext: convDecrypted[msgId] || '[Encrypted]',
        });
      }
    }
  }

  allStarred.sort((a, b) => b.msg.timestamp - a.msg.timestamp);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="starred-modal" onClick={e => e.stopPropagation()}>
        <div className="starred-header">
          <div className="starred-title-row">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 20, height: 20, color: '#f59e0b' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <h2>Starred Messages</h2>
          </div>
          <button className="starred-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="starred-list">
          {allStarred.length === 0 ? (
            <div className="starred-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, opacity: 0.3 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p>No starred messages yet.</p>
              <p className="starred-hint">Long-press or right-click a message and select "Star" to save it here.</p>
            </div>
          ) : (
            allStarred.map(({ msg, conv, plaintext }) => (
              <div key={msg.id} className="starred-item">
                <div className="starred-item-header">
                  <div className="starred-conv-info">
                    <div
                      className="starred-avatar"
                      style={{ background: `linear-gradient(135deg, ${conv.avatarBg}, ${conv.avatarText})` }}
                    >
                      {conv.initials}
                    </div>
                    <div>
                      <span className="starred-conv-name">{conv.name}</span>
                      <span className="starred-msg-sender">
                        {msg.senderId === 'me' ? 'You' : conv.name}
                      </span>
                    </div>
                  </div>
                  <span className="starred-time">{formatFullDate(msg.timestamp)}</span>
                </div>
                <p className="starred-text">{msg.isVoice ? '🎤 Voice message' : plaintext}</p>
                <div className="starred-actions">
                  <button className="starred-action-btn" onClick={() => { onGoToMessage(conv.id, msg.id); onClose(); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Go to message
                  </button>
                  <button className="starred-action-btn danger" onClick={() => onUnstar(conv.id, msg.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Unstar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
