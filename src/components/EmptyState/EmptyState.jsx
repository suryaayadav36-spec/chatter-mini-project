import React from 'react';
import './EmptyState.css';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M32 6L8 18v16c0 14 10.5 27.1 24 30.35C45.5 61.1 56 47.9 56 34V18L32 6z"
            fill="url(#shield-grad)"
            opacity="0.9"
          />
          <path d="M22 32l7 7 14-14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="shield-grad" x1="8" y1="6" x2="56" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7c3aed"/>
              <stop offset="1" stopColor="#3b82f6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h2 className="empty-state-title">CipherChat</h2>
      <p className="empty-state-description">
        Select a conversation from the sidebar to start chatting.<br/>
        All messages are encrypted with AES-GCM 256-bit before storage.
      </p>
      <div className="empty-state-badges">
        <span className="empty-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          ECDH P-256
        </span>
        <span className="empty-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          AES-GCM 256
        </span>
        <span className="empty-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          IndexedDB
        </span>
      </div>
    </div>
  );
}
