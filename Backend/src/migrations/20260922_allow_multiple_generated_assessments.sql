-- A learner may generate several distinct assessments for one completed topic.
ALTER TABLE topic_challenges
  DROP CONSTRAINT IF EXISTS uq_topic_challenges_user_topic_type;

DROP INDEX IF EXISTS uq_topic_challenges_user_topic_type;

-- Keep one reusable section challenge per learner/topic while allowing many
-- learner-generated assessments for that same topic.
CREATE UNIQUE INDEX IF NOT EXISTS uq_section_challenges_user_topic
  ON topic_challenges (user_id, topic_id)
  WHERE challenge_type = 'section';
