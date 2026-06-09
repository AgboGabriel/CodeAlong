import astService from "../services/ast.service.js";

class AstController {
  async getSupportedLanguages(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: astService.getSupportedLanguages(),
      });
    } catch (error) {
      console.error("Error fetching AST languages:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch AST languages",
      });
    }
  }

  async getBlueprint(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: astService.getBlueprint(),
      });
    } catch (error) {
      console.error("Error fetching AST blueprint:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch AST blueprint",
      });
    }
  }

  async parseSource(req, res) {
    try {
      const userId = req.user?.id || null;
      const {
        source_code,
        language_id,
        topic_id,
        persist = false,
        analysis_options = {},
        exercise_rules = {},
      } = req.body;

      const result = await astService.parseSource({
        sourceCode: source_code,
        languageId: language_id,
        userId,
        topicId: topic_id || null,
        persist,
        analysisOptions:
          Object.keys(analysis_options).length > 0
            ? analysis_options
            : exercise_rules,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error parsing AST source:", error);
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to parse source code",
      });
    }
  }

  async getHistory(req, res) {
    try {
      const userId = req.user?.id;
      const topicId = req.params.topicId ? Number(req.params.topicId) : null;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const history = await astService.getAnalysisHistory(userId, topicId, limit);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error fetching AST history:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch AST history",
      });
    }
  }
}

export default new AstController();
