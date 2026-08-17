import analyticsModel from "../models/analyticsModel.js";

class AnalyticsController {
  async getMyAnalytics(req, res) {
    try {
      const analytics = await analyticsModel.getLearnerAnalytics(req.user.id);
      return res.status(200).json(analytics);
    } catch (error) {
      console.error("analytics read error:", error);
      return res.status(500).json({ error: "Unable to load analytics" });
    }
  }
}

export default new AnalyticsController();
