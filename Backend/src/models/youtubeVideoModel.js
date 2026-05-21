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
