import database from "../config/database.js";

class CurriculumModel {
  async createCurriculum(userId, curriculum) {
    const client = await database.getClient();

    try {
      await client.query("BEGIN");

      const curriculumResult = await client.query(
        `
          INSERT INTO user_curriculums (user_id, description, status, current_module_index, current_topic_index)
          VALUES ($1, $2, 'active', 0, 0)
          RETURNING *
        `,
        [userId, curriculum.description || "Your personalized learning path is ready."]
      );

      const savedCurriculum = curriculumResult.rows[0];
      const savedModules = [];

      for (const [moduleIndex, module] of curriculum.modules.entries()) {
        const moduleResult = await client.query(
          `
            INSERT INTO curriculum_modules
            (curriculum_id, module_index, title, week, description, icon, color, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `,
          [
            savedCurriculum.id,
            moduleIndex,
            module.title,
            module.week || null,
            module.desc || module.description || null,
            module.icon || null,
            module.color || null,
            moduleIndex === 0 ? "active" : "locked",
          ]
        );

        const savedModule = moduleResult.rows[0];
        const savedTopics = [];
        const topics = Array.isArray(module.topics) ? module.topics : [];

        for (const [topicIndex, topic] of topics.entries()) {
          const topicResult = await client.query(
            `
              INSERT INTO curriculum_topics
              (module_id, topic_index, title, status)
              VALUES ($1, $2, $3, $4)
              RETURNING *
            `,
            [
              savedModule.id,
              topicIndex,
              typeof topic === "string" ? topic : topic.title,
              moduleIndex === 0 && topicIndex === 0 ? "active" : "locked",
            ]
          );

          savedTopics.push(topicResult.rows[0]);
        }

        savedModules.push({
          ...savedModule,
          topics: savedTopics,
        });
      }

      await client.query("COMMIT");

      return {
        ...savedCurriculum,
        modules: savedModules,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getCurriculumById(curriculumId, userId) {
    const curriculumResult = await database.query(
      `
        SELECT *
        FROM user_curriculums
        WHERE id = $1 AND user_id = $2
        LIMIT 1
      `,
      [curriculumId, userId]
    );

    const curriculum = curriculumResult.rows[0] || null;
    if (!curriculum) return null;

    const modulesResult = await database.query(
      `
        SELECT *
        FROM curriculum_modules
        WHERE curriculum_id = $1
        ORDER BY module_index ASC
      `,
      [curriculumId]
    );

    const modules = [];

    for (const module of modulesResult.rows) {
      const topicsResult = await database.query(
        `
          SELECT *
          FROM curriculum_topics
          WHERE module_id = $1
          ORDER BY topic_index ASC
        `,
        [module.id]
      );

      modules.push({
        ...module,
        topics: topicsResult.rows,
      });
    }

    return {
      ...curriculum,
      modules,
    };
  }

  async getModuleWithTopics(moduleId, userId) {
    const moduleResult = await database.query(
      `
        SELECT
          cm.*,
          uc.user_id,
          uc.id AS curriculum_id
        FROM curriculum_modules cm
        JOIN user_curriculums uc ON uc.id = cm.curriculum_id
        WHERE cm.id = $1 AND uc.user_id = $2
        LIMIT 1
      `,
      [moduleId, userId]
    );

    const module = moduleResult.rows[0] || null;
    if (!module) return null;

    const topicsResult = await database.query(
      `
        SELECT *
        FROM curriculum_topics
        WHERE module_id = $1
        ORDER BY topic_index ASC
      `,
      [moduleId]
    );

    return {
      ...module,
      topics: topicsResult.rows,
    };
  }
}

export default new CurriculumModel();
