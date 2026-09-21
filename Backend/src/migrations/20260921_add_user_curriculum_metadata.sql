-- Bring databases created by earlier releases up to the learning-path schema.
-- All changes are additive and safe for existing learners and curricula.
ALTER TABLE user_curriculums
  ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_module_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_topic_index INTEGER NOT NULL DEFAULT 0;

-- The UI calculates percentage complete from topic statuses, rather than
-- storing a value that can become stale after a learner progresses.
