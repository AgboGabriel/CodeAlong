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

  // ─── NEW: workspace endpoint ───────────────────────────────────────────────
  async parseWorkspace(req, res) {
    try {
      const userId = req.user?.id || null;
      const {
        tabs,
        topic_id,
        topic_title,
        persist = false,
        analysis_options = {},
      } = req.body;

      if (!Array.isArray(tabs) || tabs.length === 0) {
        return res.status(400).json({
          success: false,
          error: "tabs array is required and must not be empty",
        });
      }

      // Remap snake_case fields from the frontend to camelCase for the service
      const normalisedTabs = tabs.map((tab) => ({
        tabId: tab.tab_id ?? tab.tabId,
        name: tab.name,
        sourceCode: tab.source_code ?? tab.sourceCode ?? "",
        languageId: tab.language_id ?? tab.languageId,
      }));

      const result = await astService.parseWorkspace({
        tabs: normalisedTabs,
        topicId: topic_id || null,
        topicTitle: topic_title || "",
        persist,
        analysisOptions: analysis_options,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error parsing workspace AST:", error);
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to parse workspace",
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

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