import questionnaireService from "../services/questionnaire.service.js";

class QuestionnaireController{
    constructor(){
        this.questionnaireService=questionnaireService;
    }
    async saveQuestionnaireResponse(req,res){
        try{
            const userId = req.user?.id;
            console.log('[QuestionnaireController] save request user:', req.user ? { id: req.user.id, email: req.user.email } : null);

            if(!userId){
                console.log('[QuestionnaireController] unauthenticated save request');
                return res.status(401).json({error:"User not authenticated"});
            }
            const questionnaireData=await this.questionnaireService.saveQuestionnaireResponse(userId, req.body);
            
             return res.status(200).json({success:true, data: questionnaireData, message:"Questionnaire response saved successfully"});   


        }catch(error){
            console.error('[QuestionnaireController] Error saving questionnaire response:', error);
            return res.status(500).json({error:"Error saving questionnaire response: "+error.message});

        }
        
    }
    async getQuestionnaireByUserId(req,res){
        try{
            const userId = req.user?.id;
            if(!userId){
                return res.status(401).json({error:"User not authenticated"});
            }
            const questionnaireData= await this.questionnaireService.getQuestionnaireByUserId(userId);
            if(!questionnaireData){
                return res.status(404).json({error:"Questionnaire response not found for user"});
            }
            return res.status(200).json({success:true, data: questionnaireData});
        }catch(error){
            return res.status(500).json({error:"Error fetching questionnaire response: "+error.message});
        }
    }
}
export default new QuestionnaireController();
