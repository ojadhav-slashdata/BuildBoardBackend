-- Migration 010: Idea attachments
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS attachment_name TEXT;
