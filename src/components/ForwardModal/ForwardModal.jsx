import React, { useState } from 'react';
import './ForwardModal.css';

export default function ForwardModal({ conversations, activeConvId, onForward, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  const filtered = conversations
    .filter(c => c.id !== activeConvId)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="forward-modal" onClick={e => e.stopPropagation()}>
        <div className="forward-header">
          <h2>Forward Message</h2>
          <button className="fwd-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="forward-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="fwd-search-input"
            autoFocus
          />
        </div>

        <div className="forward-list">
          {filtered.map(conv => (
            <button
              key={conv.id}
              className={`fwd-item ${selected.has(conv.id) ? 'selected' : ''}`}
              onClick={() => toggle(conv.id)}
            >
              <div
                className="fwd-avatar"
                style={{ background: `linear-gradient(135deg, ${conv.avatarBg}, ${conv.avatarText})` }}
              >
                {conv.initials}
              </div>
              <span className="fwd-name">{conv.name}</span>
              <div className={`fwd-check ${selected.has(conv.id) ? 'checked' : ''}`}>
                {selected.has(conv.id) && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="fwd-empty">No conversations found</div>
          )}
        </div>

        <div className="forward-footer">
          <span className="fwd-count">
            {selected.size > 0 ? `${selected.size} selected` : 'Select chats to forward'}
          </span>
          <button
            className="fwd-send-btn"
            onClick={() => { onForward([...selected]); onClose(); }}
            disabled={selected.size === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
