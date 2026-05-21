import db from "../config/database.js";

class QuestionnaireService{
    constructor(){
        this.db=db;
    }
    async saveQuestionnaireResponse(userId, questionnaireData){
        try{
            const careerPath = questionnaireData.careerPath || questionnaireData.career_path;
            const knownLanguages = questionnaireData.knownLanguages || questionnaireData.known_languages || [];
            const learningLanguages = questionnaireData.learningLanguages || questionnaireData.learning_languages || [];
            const skillLevel = questionnaireData.skillLevel || questionnaireData.skill_level;
            const { goal } = questionnaireData;

            if (!careerPath || !skillLevel || !goal) {
                throw new Error("careerPath, skillLevel, and goal are required");
            }

            const query=`
                INSERT INTO user_questionnaires
                (user_id, career_path, known_languages, learning_languages, skill_level, goal) 
                VALUES ($1,$2,$3,$4,$5,$6)
                ON CONFLICT (user_id)
                DO UPDATE SET 
                career_path=EXCLUDED.career_path,
                known_languages=EXCLUDED.known_languages,
                learning_languages=EXCLUDED.learning_languages,
                skill_level=EXCLUDED.skill_level,
                goal=EXCLUDED.goal,
                updated_at=NOW()
            RETURNING *;
            `;
           const result= await this.db.query(query,[userId, careerPath, knownLanguages, learningLanguages, skillLevel, goal]);
           return result.rows[0];
        }catch(error){
            throw new Error(`Error saving questionnaire response: ${error.message}`);
        }
        
    }

    async getQuestionnaireByUserId(userId){
        try{
            const query=`SELECT * FROM user_questionnaires WHERE user_id = $1`;
            const result= await this.db.query(query,[userId]);
            return result.rows[0];
        }catch(error){
            throw new Error(`Error fetching questionnaire response: ${error.message}`);

        }
    }
};
export default new QuestionnaireService();
