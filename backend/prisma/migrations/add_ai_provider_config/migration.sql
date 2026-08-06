-- AI Provider Config Migration
-- Run this SQL in your Supabase SQL Editor

-- Create the ai_provider_configs table
CREATE TABLE IF NOT EXISTS "ai_provider_configs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "base_url" TEXT,
    "api_key" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "cached_models" JSONB,
    "balance_info" JSONB,
    "last_balance_check" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ai_provider_configs_user_id_idx" ON "ai_provider_configs"("user_id");
CREATE INDEX IF NOT EXISTS "ai_provider_configs_user_id_is_default_idx" ON "ai_provider_configs"("user_id", "is_default");

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_provider_configs_updated_at ON "ai_provider_configs";
CREATE TRIGGER update_ai_provider_configs_updated_at
    BEFORE UPDATE ON "ai_provider_configs"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
