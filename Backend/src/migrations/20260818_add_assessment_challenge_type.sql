-- Keep section challenges and post-topic assessments separate while allowing
-- each type to be generated once and then reused for the same learner/topic.
ALTER TABLE topic_challenges
  ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(20) NOT NULL DEFAULT 'section';

ALTER TABLE topic_challenges
  DROP CONSTRAINT IF EXISTS uq_topic_challenges_user_topic;

ALTER TABLE topic_challenges
  ADD CONSTRAINT uq_topic_challenges_user_topic_type
  UNIQUE (user_id, topic_id, challenge_type);

CREATE INDEX IF NOT EXISTS idx_topic_challenges_user_topic_type
  ON topic_challenges(user_id, topic_id, challenge_type, created_at DESC);
