import React from 'react';
import './TypingIndicator.css';

export default function TypingIndicator({ conversation }) {
  return (
    <div className="typing-indicator-wrapper">
      <div
        className="typing-avatar"
        style={{
          background: `linear-gradient(135deg, ${conversation?.avatarBg || '#7c3aed'}, ${conversation?.avatarText || '#a78bfa'})`,
        }}
      >
        {conversation?.initials || '?'}
      </div>
      <div className="typing-bubble">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '160ms' }} />
        <span className="typing-dot" style={{ animationDelay: '320ms' }} />
      </div>
      <span className="typing-label">{conversation?.name || 'Contact'} is typing</span>
    </div>
  );
}
