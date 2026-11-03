import React, { useState } from 'react';
import './NewConversationModal.css';

export default function NewConversationModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a name.'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return; }
    onCreate(trimmed);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ncm-content" onClick={e => e.stopPropagation()}>
        <div className="ncm-header">
          <h2>New Conversation</h2>
          <button className="ncm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="ncm-body" onSubmit={handleSubmit}>
          <div className="ncm-field">
            <label className="ncm-label" htmlFor="contact-name">Contact Name</label>
            <input
              id="contact-name"
              className={`ncm-input ${error ? 'error' : ''}`}
              type="text"
              placeholder="Enter a name…"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              autoFocus
              maxLength={50}
            />
            {error && <span className="ncm-error">{error}</span>}
          </div>

          <div className="ncm-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            A new encrypted session will be set up automatically using ECDH P-256 key exchange.
          </div>

          <div className="ncm-actions">
            <button type="button" className="ncm-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ncm-create">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
