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
async getDashboardRecommendations(req, res) {

  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const questionnaire =
      await this.questionnaireService
        .getQuestionnaireByUserId(userId);

    if (!questionnaire) {
      return res.status(404).json({
        error: "Questionnaire not found",
      });
    }

    const recommendations =
      await this.youtubeService
        .getRecommendedVideos({
          careerPath:
            questionnaire.career_path,

          skillLevel:
            questionnaire.skill_level,

          knownLanguages:
            questionnaire.known_languages,

          learningLanguages:
            questionnaire.learning_languages,
        });

    return res.status(200).json({
      success: true,
      recommendations,
    });

  } catch (error) {

    console.error(
      "Dashboard recommendations error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Failed to fetch recommendations",
    });
  }
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
      const expectedLanguage = this.youtubeService.inferLanguageFromContext(
        module.curriculum_title,
        module.title
      );
      const videos = [];
      const usedVideoIds = new Set();

      for (const topic of module.topics.slice(0, 5)) {
        const existingVideo = await this.youtubeVideoModel.findLatestByTopicId(topic.id);

        const preferredVideo = existingVideo?.is_replacement
          ? existingVideo
          : existingVideo && this.youtubeService.isVideoCompatibleWithLanguage(existingVideo, expectedLanguage)
            ? existingVideo
            : null;

        if (
          preferredVideo &&
          !usedVideoIds.has(preferredVideo.video_id || preferredVideo.videoId) &&
          this.youtubeService.isVideoCompatibleWithLanguage(preferredVideo, expectedLanguage)
        ) {
          usedVideoIds.add(preferredVideo.video_id || preferredVideo.videoId);
          videos.push({
            topic,
            video: preferredVideo,
            source: "cache",
          });
          continue;
        }

        const result = await this.youtubeService.findBestVideoForTopic({
          moduleTitle: module.title,
          topic: topic.title,
          skillLevel,
          careerPath,
          expectedLanguage,
          excludedVideoIds: [...usedVideoIds],
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
          replacement: existingVideo
            ? {
                isReplacement: true,
                replacedVideoId: existingVideo.id,
                reason: "Replaced duplicate or off-language topic video",
              }
            : {},
        });

        usedVideoIds.add(savedVideo.video_id || savedVideo.videoId);
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
