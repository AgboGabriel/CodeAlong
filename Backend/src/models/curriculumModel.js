import database from "../config/database.js";
import youtubeVideoModel from "./youtubeVideoModel.js";

class CurriculumModel {
  async createCurriculum(userId, curriculum) {
    const client = await database.getClient();

    try {
      await client.query("BEGIN");

      const curriculumResult = await client.query(
        `
          INSERT INTO user_curriculums (user_id, title, description, status, current_module_index, current_topic_index)
          VALUES ($1, $2, $3, 'active', 0, 0)
          RETURNING *
        `,
        [
          userId,
          curriculum.title || "Custom Learning Path",
          curriculum.description || "Your personalized learning path is ready.",
        ]
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

  async getCurriculumByUserId(userId) {
    const MyCurriculum = await database.query(
      `SELECT *
       FROM user_curriculums
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const curriculums = [];

    for (const curriculum of MyCurriculum.rows) {
      const modulesResult = await database.query(
        `SELECT *
         FROM curriculum_modules
         WHERE curriculum_id = $1
         ORDER BY module_index ASC`,
        [curriculum.id]
      );

      const modules = [];

      for (const module of modulesResult.rows) {
        const topicsResult = await database.query(
          `SELECT *
           FROM curriculum_topics
           WHERE module_id = $1
           ORDER BY topic_index ASC`,
          [module.id]
        );

        modules.push({
          ...module,
          topics: topicsResult.rows,
        });
      }

      curriculums.push({
        ...curriculum,
        modules,
      });
    }

    return curriculums;
  }

  async getModuleWithTopics(moduleId, userId) {
    const moduleResult = await database.query(
      `
        SELECT
          cm.*,
          uc.user_id,
          uc.id AS curriculum_id,
          uc.title AS curriculum_title
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

  async getTopicContext(topicId, userId) {
    const result = await database.query(
      `
        SELECT
          ct.*,
          cm.id AS module_id,
          cm.title AS module_title,
          cm.description AS module_description,
          uc.id AS curriculum_id,
          uc.title AS curriculum_title
        FROM curriculum_topics ct
        JOIN curriculum_modules cm ON cm.id = ct.module_id
        JOIN user_curriculums uc ON uc.id = cm.curriculum_id
        WHERE ct.id = $1 AND uc.user_id = $2
        LIMIT 1
      `,
      [topicId, userId]
    );

    const row = result.rows[0] || null;
    if (!row) return null;

    return {
      topic: {
        id: row.id,
        module_id: row.module_id,
        topic_index: row.topic_index,
        title: row.title,
        status: row.status,
      },
      module: {
        id: row.module_id,
        curriculum_id: row.curriculum_id,
        title: row.module_title,
        description: row.module_description,
      },
      curriculum: {
        id: row.curriculum_id,
        title: row.curriculum_title,
      },
    };
  }

  async updateTopicStatus(topicId, status) {
    const result = await database.query(
      `
        UPDATE curriculum_topics
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [status, topicId]
    );

    return result.rows[0] || null;
  }


  async updateModuleStatus(moduleId, status) {
    const result = await database.query(
      `UPDATE curriculum_modules
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, moduleId]
    );
    return result.rows[0] || null;
  }

  async unlockNextTopic(topicId, userId) {
    const client = await database.getClient();
    try {
      await client.query("BEGIN");

      // Get current topic position
      const topicRes = await client.query(
        `SELECT ct.id, ct.module_id, ct.topic_index, ct.status,
                cm.curriculum_id, cm.module_index
         FROM curriculum_topics ct
         JOIN curriculum_modules cm ON cm.id = ct.module_id
         JOIN user_curriculums uc ON uc.id = cm.curriculum_id
         WHERE ct.id = $1 AND uc.user_id = $2`,
        [topicId, userId]
      );

      if (!topicRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      const current = topicRes.rows[0];

      // Mark current topic completed
      await client.query(
        `UPDATE curriculum_topics
         SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [topicId]
      );

      // Try to unlock the next topic in the same module
      const nextInModuleRes = await client.query(
        `SELECT id FROM curriculum_topics
         WHERE module_id = $1 AND topic_index = $2`,
        [current.module_id, current.topic_index + 1]
      );

      if (nextInModuleRes.rows.length) {
        await client.query(
          `UPDATE curriculum_topics
           SET status = 'unlocked', updated_at = NOW()
           WHERE id = $1 AND status = 'locked'`,
          [nextInModuleRes.rows[0].id]
        );
        await client.query("COMMIT");
        return {
          unlockedTopicId: nextInModuleRes.rows[0].id,
          unlockedModuleId: null,
        };
      }

      // Last topic in module — mark module completed, unlock next module
      await client.query(
        `UPDATE curriculum_modules
         SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [current.module_id]
      );

      const nextModuleRes = await client.query(
        `SELECT id FROM curriculum_modules
         WHERE curriculum_id = $1 AND module_index = $2`,
        [current.curriculum_id, current.module_index + 1]
      );

      if (nextModuleRes.rows.length) {
        const nextModuleId = nextModuleRes.rows[0].id;

        await client.query(
          `UPDATE curriculum_modules
           SET status = 'in_progress', updated_at = NOW()
           WHERE id = $1 AND status = 'locked'`,
          [nextModuleId]
        );

        const firstTopicRes = await client.query(
          `SELECT id FROM curriculum_topics
           WHERE module_id = $1
           ORDER BY topic_index ASC
           LIMIT 1`,
          [nextModuleId]
        );

        if (firstTopicRes.rows.length) {
          await client.query(
            `UPDATE curriculum_topics
             SET status = 'unlocked', updated_at = NOW()
             WHERE id = $1 AND status = 'locked'`,
            [firstTopicRes.rows[0].id]
          );
          await client.query("COMMIT");
          return {
            unlockedTopicId: firstTopicRes.rows[0].id,
            unlockedModuleId: nextModuleId,
          };
        }
      }

      await client.query("COMMIT");
      return null; // end of curriculum
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("unlockNextTopic error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

}

export default new CurriculumModel();