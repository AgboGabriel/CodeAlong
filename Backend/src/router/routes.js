import express from 'express';
import passport from 'passport';
import Judge0Controller from "../controllers/judge0_compiler.controller.js";
import audioController from '../controllers/audio.controller.js';
import authController from '../controllers/authController.js';
import { ChatController } from '../controllers/chat.controller.js';
import { groqService } from '../services/Chat.service.js';
import userModel from '../models/userModel.js';

const router = express.Router();
const groqServiceInstance = new groqService();
const chatController = new ChatController(groqServiceInstance);

function getUserID(req) {
    // In production, extract user ID from auth token or session
    return req.headers['x-user-id'] || 'guest_user';
}

router.get('/', (req, res) => {
    res.json({
        message: 'ElevenLabs Audio API Server',
        endpoints: {
            generateAudio: 'POST /generate-audio'
        }
    });
});

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/google/failure',
        session: true,
    }),
    (req, res) => {
        res.redirect('http://localhost:5173/dashboard');
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

//GET /chat/history to retrieve chat history
router.get("/chat/history", async(req,res)=>{
  try{
    const userId= getUserID(req);
    const conversation= chatController.getConversation(userId);
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
        const result= chatController.clearConversation(userId);
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

export default router;
