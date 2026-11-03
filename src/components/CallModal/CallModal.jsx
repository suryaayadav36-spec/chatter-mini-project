import React, { useState, useEffect, useRef } from 'react';
import './CallModal.css';
import { formatTime } from '../../utils/helpers';

export default function CallModal({ conversation, type, onEnd }) {
  const [status, setStatus] = useState('calling'); // calling | connected | ended
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoOff, setVideoOff] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Simulate call connecting after 2-3s
    const connectTimer = setTimeout(() => {
      setStatus('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }, 2500);
    return () => { clearTimeout(connectTimer); clearInterval(timerRef.current); };
  }, []);

  const handleEnd = () => {
    setStatus('ended');
    clearInterval(timerRef.current);
    setTimeout(onEnd, 800);
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="call-modal-backdrop">
      <div className={`call-modal ${type === 'video' ? 'video-call' : 'voice-call'}`}>
        {/* Video background */}
        {type === 'video' && (
          <div className="video-bg">
            {!videoOff ? (
              <div className="video-feed">
                <div className="video-noise" />
                <div className="video-overlay-text">Camera simulation</div>
              </div>
            ) : (
              <div className="video-off-bg" />
            )}
          </div>
        )}

        {/* Contact info */}
        <div className="call-info">
          <div className="call-avatar" style={{ background: `linear-gradient(135deg, ${conversation?.avatarBg}, ${conversation?.avatarText})` }}>
            {conversation?.initials}
          </div>
          <h2 className="call-name">{conversation?.name}</h2>
          <p className={`call-status ${status}`}>
            {status === 'calling' && (
              <span className="calling-dots">
                Calling<span className="dot-anim">...</span>
              </span>
            )}
            {status === 'connected' && formatDuration(duration)}
            {status === 'ended' && 'Call ended'}
          </p>
          {type === 'video' && status === 'calling' && (
            <p className="call-type-label">Video call</p>
          )}
          {type === 'voice' && (
            <p className="call-type-label">Voice call · {muted ? '🔇 Muted' : '🎙 Active'}</p>
          )}
        </div>

        {/* Controls */}
        <div className="call-controls">
          {type === 'video' && (
            <button
              className={`call-btn ${videoOff ? 'active-btn' : ''}`}
              onClick={() => setVideoOff(v => !v)}
              title={videoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {videoOff ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              )}
              <span>{videoOff ? 'Cam off' : 'Camera'}</span>
            </button>
          )}

          <button
            className={`call-btn ${muted ? 'active-btn' : ''}`}
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            className={`call-btn ${!speakerOn ? 'active-btn' : ''}`}
            onClick={() => setSpeakerOn(s => !s)}
            title="Speaker"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {speakerOn && (
                <>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </>
              )}
              {!speakerOn && <line x1="23" y1="9" x2="17" y2="15"/>}
            </svg>
            <span>{speakerOn ? 'Speaker' : 'Earpiece'}</span>
          </button>

          {/* End call */}
          <button className="call-btn end-call-btn" onClick={handleEnd} title="End call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 9.6a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L10.68 13.31z"/>
            </svg>
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
