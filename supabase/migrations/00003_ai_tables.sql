-- Migration 00003: AI tables
-- ai_conversations, ai_messages

-- ============================================
-- AI_CONVERSATIONS: Chat sessions
-- ============================================
CREATE TABLE ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- AI_MESSAGES: Individual messages within a conversation
-- ============================================
CREATE TABLE ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    events_referenced TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
