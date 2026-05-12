import curriculumModel from "../models/curriculumModel.js";

class CurriculumController {
  async confirmCurriculum(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { curriculum } = req.body;

      if (!curriculum?.description || !Array.isArray(curriculum.modules)) {
        return res.status(400).json({
          error: "curriculum.description and curriculum.modules are required",
        });
      }

      const savedCurriculum = await curriculumModel.createCurriculum(userId, curriculum);
      const activeModule = savedCurriculum.modules[0] || null;

      return res.status(201).json({
        success: true,
        curriculum: savedCurriculum,
        activeModule,
      });
    } catch (error) {
      console.error("Error confirming curriculum:", error);
      return res.status(500).json({
        error: error.message || "Failed to confirm curriculum",
      });
    }
  }

  async getCurriculum(req, res) {
    try {
      const userId = req.user?.id;
      const { curriculumId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const curriculum = await curriculumModel.getCurriculumById(curriculumId, userId);

      if (!curriculum) {
        return res.status(404).json({ error: "Curriculum not found" });
      }

      return res.status(200).json({
        success: true,
        curriculum,
      });
    } catch (error) {
      console.error("Error fetching curriculum:", error);
      return res.status(500).json({
        error: error.message || "Failed to fetch curriculum",
      });
    }
  }
}

export default new CurriculumController();
