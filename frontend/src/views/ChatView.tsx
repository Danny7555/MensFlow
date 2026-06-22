import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatLockScreen } from '../components/chat/ChatLockScreen'
import { PermanentUnlockModal } from '../components/chat/PermanentUnlockModal'
import { LockSetupModal } from '../components/chat/LockSetupModal'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatEmptyState } from '../components/chat/ChatEmptyState'
import { ChatLanding } from '../components/chat/ChatLanding'
import { ChatThread } from '../components/chat/ChatThread'
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton'
import { useSEO } from '../hooks/useSEO'
import { useChatViewState } from '../hooks/useChatViewState'
import { hapticSelection, hapticMedium } from '../lib/haptics'

export function ChatView({ showOnlyLocked = false, privacyPassword }: { showOnlyLocked?: boolean; privacyPassword?: string }) {
  useSEO({
    title: 'Ask AI',
    description: "Chat with MensFlow's AI support companion to learn about your cycle, log symptoms, and retrieve personalized wellness answers.",
    keywords: 'AI assistant, cycle advice, locked chats, private tracking, secret chat'
  })

  const {
    temporaryChat,
    chatShowTimestamps,
    threadEndRef,
    filteredSessions,
    isSidebarOpen,
    setIsSidebarOpen,
    session,
    draft,
    setDraft,
    isTyping,
    suggestions,
    suggestionsLoading,
    lockForm,
    lockDispatch,
    openLockModal,
    handleLockSetupSubmit,
    handlePermanentUnlock,
    send,
    handleSessionClick,
    startNewChat,
    deleteSession,
    handleUnlockSubmit,
    sessions,
    userXp,
  } = useChatViewState({ showOnlyLocked, privacyPassword })

  const isInitialState = session.messages.length <= 1 && session.messages[0]?.id === 'welcome'

  if (session.isLoading) return <ChatSkeleton />

  return (
    <div className="chat-layout-container">
      <ChatSidebar
        sessions={filteredSessions}
        activeSessionId={session.activeSessionId}
        isOpen={isSidebarOpen}
        showOnlyLocked={showOnlyLocked}
        onSessionClick={handleSessionClick}
        onNewChat={startNewChat}
        onClose={() => setIsSidebarOpen(false)}
        onLock={openLockModal}
        onDelete={deleteSession}
      />

      <div className="chat-main-content">
        <ChatHeader
          title={temporaryChat ? 'Temporary Chat' : !session.activeSessionId ? 'New Chat' : (sessions.find(s => s.sessionId === session.activeSessionId)?.title ?? 'New Conversation')}
          sidebarOpen={isSidebarOpen}
          onToggleSidebar={() => { hapticSelection(); setIsSidebarOpen(!isSidebarOpen) }}
          hasActiveSession={!!session.activeSessionId}
          isLocked={!!(session.activeSessionId && sessions.find(s => s.sessionId === session.activeSessionId)?.isLocked)}
          isLocking={lockForm.isLockingSession || lockForm.isSettingUpLock}
          onLock={(e) => { hapticMedium(); if (session.activeSessionId) { void openLockModal(session.activeSessionId, e) } }}
          onUnlock={() => session.activeSessionId && lockDispatch({ type: 'OPEN_PERMANENT_UNLOCK', sessionId: session.activeSessionId })}
        />

        {temporaryChat && (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--mf-border)] bg-[var(--mf-card)] px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Temporary chat can use what you say in this thread to answer better, but it will not save messages or update dashboard data. Switch to a saved chat when you want cycle details from the conversation to populate your profile.
          </div>
        )}

        {session.lockedSessionToUnlock ? (
          <ChatLockScreen unlockInfo={session.lockedSessionToUnlock} onSubmit={handleUnlockSubmit} />
        ) : showOnlyLocked && filteredSessions.length === 0 ? (
          <ChatEmptyState />
        ) : isInitialState ? (
          <ChatLanding
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            isTyping={isTyping}
            draft={draft}
            onSend={send}
            onDraftChange={setDraft}
          />
        ) : (
          <ChatThread
            messages={session.messages}
            isTyping={isTyping}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            draft={draft}
            onSend={send}
            onDraftChange={setDraft}
            chatShowTimestamps={chatShowTimestamps}
            temporaryChat={temporaryChat}
            userXp={userXp}
            threadEndRef={threadEndRef}
          />
        )}
      </div>

      {lockForm.permanentUnlockSessionId && (
        <PermanentUnlockModal
          sessionId={lockForm.permanentUnlockSessionId}
          passcode={lockForm.permanentUnlockPasscode}
          onPasscodeChange={(v) => lockDispatch({ type: 'SET_PERMANENT_PASSCODE', passcode: v })}
          onConfirm={handlePermanentUnlock}
          onCancel={() => lockDispatch({ type: 'CLOSE_ALL' })}
        />
      )}

      {lockForm.lockSetupSessionId && (
        <LockSetupModal
          passcode={lockForm.lockSetupPasscode}
          isLocking={lockForm.isSettingUpLock}
          questionId={lockForm.lockSetupQuestionId}
          answer={lockForm.lockSetupAnswer}
          onPasscodeChange={(v) => lockDispatch({ type: 'SET_PASSCODE', passcode: v })}
          onQuestionChange={(qid) => lockDispatch({ type: 'SET_QUESTION', questionId: qid })}
          onAnswerChange={(a) => lockDispatch({ type: 'SET_ANSWER', answer: a })}
          onSubmit={handleLockSetupSubmit}
          onCancel={() => lockDispatch({ type: 'CLOSE_ALL' })}
        />
      )}
    </div>
  )
}
