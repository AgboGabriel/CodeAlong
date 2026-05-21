import youtubeService from "../services/youtubeService.js";
import youtubeVideoModel from "../models/youtubeVideoModel.js";
import questionnaireService from "../services/questionnaire.service.js";
import curriculumModel from "../models/curriculumModel.js";

class YoutubeController {
  constructor() {
    this.youtubeService = youtubeService;
    this.youtubeVideoModel = youtubeVideoModel;
    this.questionnaireService = questionnaireService;
    this.curriculumModel = curriculumModel;
  }

  async getVideosForModule(req, res) {
    try {
      const userId = req.user?.id;
      const { moduleId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const module = await this.curriculumModel.getModuleWithTopics(moduleId, userId);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const questionnaire = await this.questionnaireService.getQuestionnaireByUserId(userId);

      if (!questionnaire) {
        return res.status(404).json({
          error: "Questionnaire data not found for user",
        });
      }

      const careerPath = questionnaire.career_path;
      const skillLevel = questionnaire.skill_level;
      const videos = [];

      for (const topic of module.topics.slice(0, 5)) {
        const existingVideo = await this.youtubeVideoModel.findLatestByTopicId(topic.id);

        if (existingVideo) {
          videos.push({
            topic,
            video: existingVideo,
            source: "cache",
          });
          continue;
        }

        const result = await this.youtubeService.findBestVideoForTopic({
          moduleTitle: module.title,
          topic: topic.title,
          skillLevel,
          careerPath,
        });

        if (!result.video) {
          videos.push({
            topic,
            video: null,
            source: "youtube",
          });
          continue;
        }

        const savedVideo = await this.youtubeVideoModel.saveTopicVideo({
          userId,
          curriculumId: module.curriculum_id,
          moduleId: module.id,
          topicId: topic.id,
          video: result.video,
        });

        videos.push({
          topic,
          video: savedVideo,
          source: "youtube",
        });
      }

      return res.status(200).json({
        success: true,
        module,
        careerPath,
        skillLevel,
        videos,
      });
    } catch (error) {
      console.error("Error getting videos for module:", error);
      return res.status(500).json({
        error: error.message || "Failed to get videos",
      });
    }
  }
}

export default new YoutubeController();
