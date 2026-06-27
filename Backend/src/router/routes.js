import express from 'express';
import passport from 'passport';
import Judge0Controller from "../controllers/judge0_compiler.controller.js";
import astController from "../controllers/astController.js";
import audioController from '../controllers/audio.controller.js';
import authController from '../controllers/authController.js';
import { ChatController } from '../controllers/chat.controller.js';
import { groqService } from '../services/Chat.service.js';
import userModel from '../models/userModel.js';
import questionnaireController from '../controllers/questionnaire.controller.js';
import curriculumController from '../controllers/curriculumController.js';
import youtubeController from '../controllers/youtubeController.js';
import bktController from "../controllers/bktController.js";
import assessmentContentController from "../controllers/assessmentContentController.js";


const router = express.Router();
const groqServiceInstance = new groqService();
const chatController = new ChatController(groqServiceInstance);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
}

function getUserID(req) {
    // Prefer the real authenticated user id; fall back to header for dev/test
    return req.user?.id ?? req.headers['x-user-id'] ?? 'guest_user';
}

router.get('/', (req, res) => {
    res.json({
        message: 'ElevenLabs Audio API Server',
        endpoints: {
            generateAudio: 'POST /generate-audio'
        }
    });
});

router.post(
  "/api/topic/:topicId/attempt",
  ensureAuthenticated,
  (req, res) => bktController.submitTopicAttempt(req, res)
);

router.get(
  "/api/topic/:topicId/mastery",
  ensureAuthenticated,
  (req, res) => bktController.getTopicMastery(req, res)
);
// Add to routes.js

router.post("/api/ast/workspace/parse", (req, res) => {
  astController.parseWorkspace(req, res);
});

router.get(
  "/api/topic/:topicId/can-progress",
  ensureAuthenticated,
  (req, res) => bktController.canProgressToNextTopic(req, res)
);

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

//auth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/google/failure',
        session: true,
    }),
   (req, res) => {
    const backendUrl =
      process.env.FRONTEND_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    // check if questionnaire exists
    if (!req.user.questionnaire_completed) {
      return res.redirect(`${backendUrl}/Questionnaire`);
    }

    return res.redirect(`${backendUrl}/dashboard`);
}
);
router.get('/auth/google/failure', (req, res) => {
    res.status(401).json({ error: 'Google authentication failed' });
});

router.post('/generate-audio', audioController.generateAudio);
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/auth/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
router.post('/auth/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/auth/me', (req, res) => authController.me(req, res));

//questionnaire routes
router.post("/api/questionnaire", ensureAuthenticated, (req,res)=>{
    questionnaireController.saveQuestionnaireResponse(req,res);
});
router.get("/api/questionnaire", ensureAuthenticated, (req,res)=>{
    questionnaireController.getQuestionnaireByUserId(req,res);
});
router.get(
  "/api/dashboard/recommendations",
  ensureAuthenticated,
  (req, res) => {
    youtubeController
      .getDashboardRecommendations(req, res);
  }
);
//curriculum routes
router.post("/api/curriculum/confirm", ensureAuthenticated, (req,res)=>{
    curriculumController.confirmCurriculum(req,res);
});

router.get(
  "/api/curriculum",
  ensureAuthenticated,
  (req, res) => {
    curriculumController.getUserCurriculums(req, res);
  }
);

router.get("/api/curriculum/:curriculumId", ensureAuthenticated, (req,res)=>{
    curriculumController.getCurriculum(req,res);
});


//youtube video routes
router.get("/api/videos/module/:moduleId", ensureAuthenticated, (req,res)=>{
    youtubeController.getVideosForModule(req,res);
});

router.post('/db-test/users',async(req,res)=>{
    try{
        const {username,email,password_hash,auth_provider,google_id}= req.body;
        const new_user= await userModel.createUser({
            username,
            email,
            password_hash,
            auth_provider,
            google_id
        })
        res.status(201).json({ success: true, user: new_user });
    }catch(error){
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
//POST /chat/video-context — returns a system prompt built from video metadata
router.post('/chat/video-context', (req, res) => {
    try {
        const { video, topic } = req.body;
        if (!video) {
            return res.status(400).json({ success: false, error: 'video is required' });
        }
        const systemPrompt = chatController.buildVideoSystemPrompt({ video, topic });
        return res.status(200).json({ success: true, systemPrompt });
    } catch (error) {
        console.error('Video context route error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

//POST /chat which is to send messages
router.post('/chat',async(req,res)=>{
    try{
        const {message, options} = req.body;
        const userId = getUserID(req);
        const response = await chatController.processMessage(userId, message, options);
    if(response.success){
        res.status(200).json(response);
    } else{
        res.status(500).json(response); 
    }
    } catch(error){
        console.error('Chat route error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// POST /chat/curriculum which returns structured curriculum JSON
router.post('/chat/curriculum', async(req,res)=>{
    try{
        const {message, options} = req.body;
        const userId = getUserID(req);
        const response = await chatController.buildCurriculum(userId, message, options);
        if(response.success){
            res.status(200).json(response);
        } else{
            res.status(response.statusCode || 500).json(response);
        }
    } catch(error){
        console.error('Curriculum route error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

//GET /chat/history to retrieve chat history
router.get("/chat/history", async(req,res)=>{
  try{
    const userId= getUserID(req);
    const conversation = await chatController.getConversation(userId);
    res.status(200).json({
        success:true,
        conversation: conversation
    });
  }catch(error){
    console.error('Chat history route error:', error);
    res.status(500).json({
        success:false,
        error: error.message || 'Internal server error'
    });
  }
})

// DELETE /chat/history to clear chat history
router.delete("/chat/history", async(req,res)=>{

    try{
        const userId= getUserID(req);
        const result = await chatController.clearConversation(userId);
        res.status(200).json({
            success:true,
            message: result
        });
    } catch(error){
        console.error('Clear chat history route error:', error);
        res.status(500).json({
            success:false,
            error: error.message || 'Internal server error'
        });
    }
})

// POST /api/judge0/compile
router.post('/compile', Judge0Controller.compileCode);

// GET /api/judge0/result/:token
router.get('/result/:token', Judge0Controller.getResult);

// POST /api/judge0/compile-poll (with built-in polling)
router.post('/compile-poll', Judge0Controller.compileWithPolling);

// GET /api/judge0/languages
router.get('/languages', Judge0Controller.getLanguages);

router.post(
  "/api/assessment/prior-quiz",
  ensureAuthenticated,
  (req, res) => assessmentContentController.generatePriorKnowledgeQuiz(req, res)
);

router.post(
  "/api/assessment/challenge",
  ensureAuthenticated,
  (req, res) => assessmentContentController.generateTopicChallenge(req, res)
);

router.post(
  "/api/assessment/challenge/evaluate",
  ensureAuthenticated,
  (req, res) => assessmentContentController.evaluateChallengeSubmission(req, res)
);

// AST routes kept separate from Judge0 execution for review
router.get("/api/ast/languages", (req, res) => {
    astController.getSupportedLanguages(req, res);
});

router.get("/api/ast/blueprint", (req, res) => {
    astController.getBlueprint(req, res);
});

router.post("/api/ast/parse", (req, res) => {
    astController.parseSource(req, res);
});

router.get("/api/ast/history", ensureAuthenticated, (req, res) => {
    astController.getHistory(req, res);
});

router.get("/api/ast/history/:topicId", ensureAuthenticated, (req, res) => {
    astController.getHistory(req, res);
});

export default router;