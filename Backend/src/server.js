
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import audioController from './controllers/audio.controller.js';
import judge0Routes from "./router/routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration


app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Routes


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/judge0', judge0Routes);

app.get("/", (req, res) => {
    res.json({
        message: "ElevenLabs Audio API Server",
        endpoints: {
            generateAudio: "POST /generate-audio"
        }
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});


app.post("/generate-audio", audioController.generateAudio);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Audio endpoint: POST http://localhost:${PORT}/generate-audio`);
});