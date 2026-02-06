
import express from 'express';
import Judge0Controller from "../controllers/judge0_compiler.controller.js";
import cors from 'cors';
import { ChatController } from '../controllers/chat.controller.js';
import { groqService } from '../services/Chat.service.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors());


const router = express.Router();
const groqServiceInstance = new groqService();
const chatController = new ChatController(groqServiceInstance);

function getUserID(req) {
    // In production, extract user ID from auth token or session
    return req.headers['x-user-id'] || 'guest_user';
}

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