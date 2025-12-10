
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import audioController from './controllers/audio.controller.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "ElevenLabs Audio API Server",
        endpoints: {
            generateAudio: "POST /generate-audio"
        }
    });
});

app.post("/generate-audio", audioController.generateAudio);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🎵 Audio endpoint: POST http://localhost:${PORT}/generate-audio`);
});