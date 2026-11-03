import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MessageInput.css';
import EmojiPicker from '../EmojiPicker/EmojiPicker';

export default function MessageInput({ onSend, disabled, replyingTo, onCancelReply, contactName }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachTooltip, setShowAttachTooltip] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const textareaRef = useRef(null);
  const recordTimerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowEmoji(false);
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInput = useCallback((e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  }, []);

  const insertEmoji = useCallback((emoji) => {
    const el = textareaRef.current;
    if (!el) { setText(t => t + emoji); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus(); }, 0);
  }, [text]);

  // Voice recording
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordDuration(0);
    recordTimerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(recordTimerRef.current);
    const duration = recordDuration;
    setIsRecording(false);
    setRecordDuration(0);
    if (duration >= 1) {
      onSend('🎤 Voice message', { isVoice: true, voiceDuration: duration });
    }
  }, [recordDuration, onSend]);

  useEffect(() => () => clearInterval(recordTimerRef.current), []);

  // Close emoji on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => { if (!emojiPickerRef.current?.contains(e.target)) setShowEmoji(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const formatDur = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="message-input-area">
      {/* Reply bar */}
      {replyingTo && (
        <div className="reply-bar-input">
          <div className="reply-bar-accent" />
          <div className="reply-bar-content">
            <span className="reply-bar-author">{replyingTo.msg.senderId === 'me' ? 'You' : contactName}</span>
            <span className="reply-bar-text">{replyingTo.plaintext}</span>
          </div>
          <button className="reply-cancel" onClick={onCancelReply}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Recording overlay */}
      {isRecording && (
        <div className="recording-bar">
          <span className="rec-dot" />
          <span className="rec-label">Recording… {formatDur(recordDuration)}</span>
          <button className="rec-cancel" onClick={() => { clearInterval(recordTimerRef.current); setIsRecording(false); setRecordDuration(0); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
            Cancel
          </button>
        </div>
      )}

      <div className="message-input-wrap">
        {/* Emoji */}
        <div className="emoji-btn-wrapper" ref={emojiPickerRef}>
          <button
            className={`input-icon-btn ${showEmoji ? 'active' : ''}`}
            onClick={() => setShowEmoji(p => !p)}
            title="Emoji"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        </div>

        {/* Attach */}
        <div className="attach-wrapper">
          <button
            className="input-icon-btn"
            onClick={() => setShowAttachTooltip(p => !p)}
            title="Attach"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          {showAttachTooltip && (
            <div className="attach-tooltip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              File attachments coming soon
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            placeholder={isRecording ? '' : 'Type an encrypted message…'}
            value={text}
            onInput={handleInput}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled || isRecording}
          />
          {text.length > 500 && (
            <span className={`char-count ${text.length > 1000 ? 'warning' : ''}`}>{text.length}</span>
          )}
        </div>

        {/* Send / Voice */}
        <div className="send-area">
          <div className="enc-hint" title="End-to-end encrypted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          {text.trim() ? (
            <button className="send-btn active" onClick={handleSend} disabled={disabled} title="Send (Enter)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          ) : isRecording ? (
            <button className="send-btn active recording-send" onClick={stopRecording} title="Send voice message">
              <svg viewBox="0 0 24 24" fill="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button
              className="send-btn voice-btn"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={disabled}
              title="Hold to record voice message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="input-hint">
        <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> new line · Hold 🎤 for voice
      </p>
    </div>
  );
}
