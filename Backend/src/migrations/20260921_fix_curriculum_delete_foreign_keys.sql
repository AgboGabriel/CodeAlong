-- Keep historical mastery and replacement-video rows when a curriculum is deleted.
-- The references are cleared instead of blocking the curriculum cascade.

ALTER TABLE topic_mastery
  DROP CONSTRAINT IF EXISTS topic_mastery_last_quiz_id_fkey;

ALTER TABLE topic_mastery
  ADD CONSTRAINT topic_mastery_last_quiz_id_fkey
  FOREIGN KEY (last_quiz_id)
  REFERENCES topic_quizzes(id)
  ON DELETE SET NULL;

ALTER TABLE topic_videos
  DROP CONSTRAINT IF EXISTS topic_videos_replaced_video_id_fkey;

ALTER TABLE topic_videos
  ADD CONSTRAINT topic_videos_replaced_video_id_fkey
  FOREIGN KEY (replaced_video_id)
  REFERENCES topic_videos(id)
  ON DELETE SET NULL;