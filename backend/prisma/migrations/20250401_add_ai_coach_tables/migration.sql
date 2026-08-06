-- AI Coach Feature Migration (FIXED)
-- Use TEXT type for all IDs to match users.id type

-- First, drop tables if they exist (clean slate)
DROP TABLE IF EXISTS "ai_coach_messages" CASCADE;
DROP TABLE IF EXISTS "ai_coach_routines" CASCADE;
DROP TABLE IF EXISTS "ai_coach_conversations" CASCADE;

-- Create ai_coach_conversations table
CREATE TABLE IF NOT EXISTS "ai_coach_conversations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_coach_conversations_pkey" PRIMARY KEY ("id")
);

-- Create ai_coach_messages table
CREATE TABLE IF NOT EXISTS "ai_coach_messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_coach_messages_pkey" PRIMARY KEY ("id")
);

-- Create ai_coach_routines table
CREATE TABLE IF NOT EXISTS "ai_coach_routines" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "focus_muscles" TEXT[],
    "routine_type" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "estimated_duration" INTEGER,
    "difficulty" TEXT,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_coach_routines_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ai_coach_conversations_user_id_idx" ON "ai_coach_conversations"("user_id");
CREATE INDEX IF NOT EXISTS "ai_coach_conversations_user_id_is_active_idx" ON "ai_coach_conversations"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "ai_coach_conversations_last_message_at_idx" ON "ai_coach_conversations"("last_message_at");

CREATE INDEX IF NOT EXISTS "ai_coach_messages_conversation_id_idx" ON "ai_coach_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "ai_coach_messages_conversation_id_created_at_idx" ON "ai_coach_messages"("conversation_id", "created_at");

CREATE INDEX IF NOT EXISTS "ai_coach_routines_user_id_idx" ON "ai_coach_routines"("user_id");
CREATE INDEX IF NOT EXISTS "ai_coach_routines_user_id_is_saved_idx" ON "ai_coach_routines"("user_id", "is_saved");
CREATE INDEX IF NOT EXISTS "ai_coach_routines_conversation_id_idx" ON "ai_coach_routines"("conversation_id");

-- Add foreign key constraints
ALTER TABLE "ai_coach_conversations" 
    ADD CONSTRAINT "ai_coach_conversations_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_coach_messages" 
    ADD CONSTRAINT "ai_coach_messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "ai_coach_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_coach_routines" 
    ADD CONSTRAINT "ai_coach_routines_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_coach_routines" 
    ADD CONSTRAINT "ai_coach_routines_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "ai_coach_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
