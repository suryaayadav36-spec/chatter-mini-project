import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import InfoPanel from './components/InfoPanel/InfoPanel';
import EncryptionModal from './components/EncryptionModal/EncryptionModal';
import NewConversationModal from './components/NewConversationModal/NewConversationModal';
import ToastContainer from './components/Toast/Toast';
import CallModal from './components/CallModal/CallModal';
import StarredMessages from './components/StarredMessages/StarredMessages';
import { useChat } from './hooks/useChat';

const CURRENT_USER = { name: 'You', initials: 'YO' };

export default function App() {
  const {
    conversations, activeConversationId, messages, decryptedMessages,
    typingContacts, encryptionSessions, isInitialized, toasts,
    replyingTo, selectedMessages, starredMessages, pinnedMessages,
    sendMessage, selectConversation, createConversation, clearConversation,
    deleteMessage, reactToMessage, starMessage, pinMessage, forwardMessage,
    toggleSelectMessage, clearSelection, deleteSelectedMessages,
    setReply, clearReply,
    muteConversation, archiveConversation, pinConversation,
    setDisappearingMessages,
    removeToast, addToast,
  } = useChat();

  const [theme, setTheme] = useState(() => localStorage.getItem('cc-theme') || 'dark');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type: 'voice'|'video' }
  const [mobileView, setMobileView] = useState('sidebar');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc-theme', theme);
  }, [theme]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const activeSession = activeConversationId ? encryptionSessions[activeConversationId] : null;
  const activePinnedId = activeConversationId ? pinnedMessages[activeConversationId] : null;

  const handleSelectConversation = useCallback((id) => {
    selectConversation(id);
    setMobileView('chat');
    setShowInfoPanel(false);
  }, [selectConversation]);

  const handleBack = useCallback(() => setMobileView('sidebar'), []);

  const handleCreateConversation = useCallback(async (name) => {
    const id = await createConversation(name);
    if (id) handleSelectConversation(id);
  }, [createConversation, handleSelectConversation]);

  const handleGoToMessage = useCallback((convId, msgId) => {
    handleSelectConversation(convId);
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }, [handleSelectConversation]);

  const handleSend = useCallback((convId, text, opts = {}) => {
    const options = { ...opts };
    if (replyingTo?.convId === convId) {
      options.replyTo = { id: replyingTo.msg.id, senderId: replyingTo.msg.senderId, text: replyingTo.plaintext };
      clearReply();
    }
    sendMessage(convId, text, options);
  }, [sendMessage, replyingTo, clearReply]);

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z" fill="currentColor"/>
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="loading-text">Initializing CipherChat…</p>
        <p className="loading-sub">Generating ECDH key pairs · Setting up AES-GCM sessions</p>
      </div>
    );
  }

  return (
    <div className={`app-layout ${mobileView}`}>
      {/* Sidebar */}
      <div className={`sidebar-container ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}>
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          messages={messages}
          decryptedMessages={decryptedMessages}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setShowNewConvModal(true)}
          currentUser={CURRENT_USER}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onMute={muteConversation}
          onArchive={archiveConversation}
          onPin={pinConversation}
          onClear={clearConversation}
        />
      </div>

      {/* Chat */}
      <div className={`chat-container ${mobileView === 'sidebar' ? 'mobile-hidden' : ''}`}>
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          decryptedMessages={decryptedMessages}
          typingContacts={typingContacts}
          encryptionSession={activeSession}
          conversations={conversations}
          onSend={handleSend}
          onDelete={deleteMessage}
          onReact={reactToMessage}
          onReply={setReply}
          onStar={starMessage}
          onPin={pinMessage}
          onForward={forwardMessage}
          onShowInfo={() => setShowInfoPanel(p => !p)}
          onShowEncryption={() => setShowEncryptionModal(true)}
          onBack={handleBack}
          showInfoPanel={showInfoPanel}
          onVoiceCall={() => activeConversation && setActiveCall({ type: 'voice' })}
          onVideoCall={() => activeConversation && setActiveCall({ type: 'video' })}
          onMute={() => activeConversationId && muteConversation(activeConversationId)}
          onArchive={() => activeConversationId && archiveConversation(activeConversationId)}
          onDisappearing={(dur) => activeConversationId && setDisappearingMessages(activeConversationId, dur)}
          onShowStarred={() => setShowStarredModal(true)}
          replyingTo={replyingTo}
          onCancelReply={clearReply}
          selectedMessages={selectedMessages}
          onSelectMessage={toggleSelectMessage}
          onClearSelection={() => activeConversationId && clearSelection(activeConversationId)}
          onDeleteSelected={() => activeConversationId && deleteSelectedMessages(activeConversationId)}
        />
      </div>

      {/* Info Panel */}
      {showInfoPanel && activeConversation && (
        <div className="info-container">
          <InfoPanel
            conversation={activeConversation}
            messages={messages}
            encryptionSession={activeSession}
            onClearConversation={clearConversation}
            onClose={() => setShowInfoPanel(false)}
          />
        </div>
      )}

      {/* Modals */}
      {showEncryptionModal && (
        <EncryptionModal
          session={activeSession}
          conversation={activeConversation}
          onClose={() => setShowEncryptionModal(false)}
        />
      )}
      {showNewConvModal && (
        <NewConversationModal
          onClose={() => setShowNewConvModal(false)}
          onCreate={handleCreateConversation}
        />
      )}
      {showStarredModal && (
        <StarredMessages
          conversations={conversations}
          messages={messages}
          decryptedMessages={decryptedMessages}
          starredMessages={starredMessages}
          onClose={() => setShowStarredModal(false)}
          onGoToMessage={handleGoToMessage}
          onUnstar={starMessage}
        />
      )}

      {/* Call */}
      {activeCall && (
        <CallModal
          conversation={activeConversation}
          type={activeCall.type}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
