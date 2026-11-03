import React from 'react';
import './EncryptionModal.css';

export default function EncryptionModal({ session, conversation, onClose }) {
  if (!session) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-lock-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Encryption Details</h2>
              <p className="modal-subtitle">This conversation is end-to-end encrypted</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Status */}
          <div className="encryption-status">
            <span className="status-dot-enc" />
            <span className="status-text">Encrypted &amp; Active</span>
          </div>

          {/* Algorithm cards */}
          <div className="algo-grid">
            <div className="algo-card">
              <div className="algo-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="algo-label">Key Exchange</div>
                <div className="algo-value">ECDH P-256</div>
              </div>
            </div>

            <div className="algo-card">
              <div className="algo-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="algo-label">Key Derivation</div>
                <div className="algo-value">HKDF-SHA-256</div>
              </div>
            </div>

            <div className="algo-card">
              <div className="algo-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div className="algo-label">Message Encryption</div>
                <div className="algo-value">AES-GCM 256-bit</div>
              </div>
            </div>

            <div className="algo-card">
              <div className="algo-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </div>
              <div>
                <div className="algo-label">Authentication</div>
                <div className="algo-value">GCM AEAD Tag</div>
              </div>
            </div>
          </div>

          {/* Fingerprints */}
          <div className="fingerprint-section">
            <h3 className="section-title">Key Fingerprints</h3>
            <div className="fingerprint-card">
              <div className="fingerprint-label">Your Key</div>
              <code className="fingerprint-value">{session.myFingerprint}</code>
            </div>
            <div className="fingerprint-card">
              <div className="fingerprint-label">{conversation?.name}'s Key</div>
              <code className="fingerprint-value">{session.peerFingerprint}</code>
            </div>
          </div>

          {/* How it works */}
          <div className="how-it-works">
            <h3 className="section-title">How Your Messages Are Protected</h3>
            <ol className="steps-list">
              <li>Your browser generates a unique <strong>ECDH P-256 key pair</strong> for this conversation.</li>
              <li>A <strong>shared secret</strong> is derived via Diffie-Hellman key agreement — no keys are transmitted.</li>
              <li><strong>HKDF-SHA-256</strong> derives a strong 256-bit AES key from the shared secret.</li>
              <li>Every message is encrypted with <strong>AES-GCM</strong> using a unique random IV.</li>
              <li>Only encrypted ciphertext is stored in <strong>IndexedDB</strong> — never plaintext.</li>
            </ol>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>
              <strong>Educational Simulation:</strong> CipherChat demonstrates real browser-native cryptography.
              However, both "participants" are simulated locally — this is not a network-connected system.
              Anyone with physical access to your browser or device can access the stored keys and data.
              Do not use this to protect sensitive real-world communications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
