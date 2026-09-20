import database from "../config/database.js";

class YoutubeVideoModel {
  async findLatestByTopicId(topicId) {
    const query = `
      SELECT *
      FROM topic_videos
      WHERE topic_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await database.query(query, [topicId]);
    return result.rows[0] || null;
  }

  // Adaptive support is personal: a video shown to one learner must not
  // influence another learner's recommendation history.
  async findByTopicAndUser(topicId, userId) {
    const query = `
      SELECT *
      FROM topic_videos
      WHERE topic_id = $1
        AND user_id = $2
      ORDER BY created_at ASC
    `;

    const result = await database.query(query, [topicId, userId]);
    return result.rows;
  }

  async saveTopicVideo({ userId, curriculumId, moduleId, topicId, video, replacement = {} }) {
    const query = `
      INSERT INTO topic_videos
      (
        user_id,
        curriculum_id,
        module_id,
        topic_id,
        video_id,
        title,
        description,
        channel_title,
        thumbnail,
        url,
        view_count,
        like_count,
        duration,
        score,
        is_replacement,
        replaced_video_id,
        replacement_reason
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `;

    const values = [
      userId,
      curriculumId,
      moduleId,
      topicId,
      video.videoId,
      video.title,
      video.description,
      video.channelTitle,
      video.thumbnail,
      video.url,
      video.viewCount || 0,
      video.likeCount || 0,
      video.duration,
      video.score || 0,
      replacement.isReplacement || false,
      replacement.replacedVideoId || null,
      replacement.reason || null,
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  }
}

export default new YoutubeVideoModel();
