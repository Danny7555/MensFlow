export const SETTINGS_STORAGE_KEY = 'mensflow-settings-v1'
export const CHAT_STORAGE_KEY = 'mensflow-chat-messages-v1'


export const CLEAR_LOCAL_CHATS_EVENT = 'mensflow:clear-local-chats'

export const SECURITY_QUESTIONS = [
  { id: 'q1', label: 'What was the name of your first pet?', type: 'text' },
  { id: 'q2', label: 'What is your favorite color?', type: 'select', options: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Purple', 'Orange'] },
  { id: 'q3', label: 'In what city were you born?', type: 'text' },
  { id: 'q4', label: 'What is your favorite season?', type: 'select', options: ['Spring', 'Summer', 'Autumn', 'Winter'] },
]
