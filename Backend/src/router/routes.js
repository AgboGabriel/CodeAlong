// routes/judge0.routes.js
import express from 'express';
import Judge0Controller from "../controllers/judge0_compiler.controller.js";
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors());


const router = express.Router();

// POST /api/judge0/compile
router.post('/compile', Judge0Controller.compileCode);

// GET /api/judge0/result/:token
router.get('/result/:token', Judge0Controller.getResult);

// POST /api/judge0/compile-poll (with built-in polling)
router.post('/compile-poll', Judge0Controller.compileWithPolling);

// GET /api/judge0/languages
router.get('/languages', Judge0Controller.getLanguages);

export default router;