-- Older deployed databases were created before this field was added to the
-- schema. Keep existing learning paths and supply the UI's default level.
ALTER TABLE user_curriculums
  ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT 'Beginner';
