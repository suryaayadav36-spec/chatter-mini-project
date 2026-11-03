import React, { useState } from 'react';
import './InfoPanel.css';
import { formatFullDate } from '../../utils/helpers';

export default function InfoPanel({ conversation, messages, encryptionSession, onClearConversation, onClose }) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!conversation) return null;

  const convMessages = messages[conversation.id] || [];
  const sentCount = convMessages.filter(m => m.senderId === 'me').length;
  const receivedCount = convMessages.filter(m => m.senderId !== 'me').length;

  const firstMessage = convMessages[0];
  const storage = convMessages.length * 0.5; // rough estimate KB

  return (
    <aside className="info-panel">
      <div className="info-panel-header">
        <h3 className="info-panel-title">Conversation Info</h3>
        <button className="info-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Contact */}
      <div className="info-contact">
        <div
          className="info-avatar"
          style={{
            background: `linear-gradient(135deg, ${conversation.avatarBg}, ${conversation.avatarText})`,
          }}
        >
          {conversation.initials}
        </div>
        <div className="info-contact-name">{conversation.name}</div>
        <div className={`info-contact-status ${conversation.online ? 'online' : 'offline'}`}>
          <span className="info-status-dot" />
          {conversation.online ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Encryption */}
      <div className="info-section">
        <div className="info-section-label">Security</div>
        <div className="info-card">
          <div className="info-card-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="info-row-icon green">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div>
              <div className="info-row-label">Encryption</div>
              <div className="info-row-value">AES-GCM 256-bit</div>
            </div>
          </div>
          <div className="info-card-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="info-row-icon blue">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <div>
              <div className="info-row-label">Key Exchange</div>
              <div className="info-row-value">ECDH P-256</div>
            </div>
          </div>
          {encryptionSession && (
            <div className="encryption-active-badge">
              <span className="enc-dot" />
              End-to-end encrypted
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="info-section">
        <div className="info-section-label">Statistics</div>
        <div className="info-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{convMessages.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{sentCount}</div>
            <div className="stat-label">Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{receivedCount}</div>
            <div className="stat-label">Received</div>
          </div>
        </div>
        {firstMessage && (
          <div className="info-card" style={{ marginTop: 8 }}>
            <div className="info-row-label">Session started</div>
            <div className="info-row-value">{formatFullDate(firstMessage.timestamp)}</div>
          </div>
        )}
      </div>

      {/* Storage */}
      <div className="info-section">
        <div className="info-section-label">Storage</div>
        <div className="info-card">
          <div className="info-row-label">Storage type</div>
          <div className="info-row-value">IndexedDB (Local)</div>
          <div className="info-row-label" style={{ marginTop: 8 }}>Estimated size</div>
          <div className="info-row-value">~{storage.toFixed(1)} KB</div>
          <div className="info-row-label" style={{ marginTop: 8 }}>Data format</div>
          <div className="info-row-value">AES-GCM ciphertext</div>
        </div>
      </div>

      {/* Actions */}
      <div className="info-section">
        <div className="info-section-label">Actions</div>
        {!confirmClear ? (
          <button
            className="danger-btn"
            onClick={() => setConfirmClear(true)}
            disabled={convMessages.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Clear Conversation
          </button>
        ) : (
          <div className="confirm-clear">
            <p>This will permanently delete all messages. Are you sure?</p>
            <div className="confirm-btns">
              <button className="confirm-yes" onClick={() => { onClearConversation(conversation.id); setConfirmClear(false); }}>
                Yes, clear
              </button>
              <button className="confirm-no" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
