
import { generateSpeech } from "../services/ElevenLabs.service.js"; // Keep importing from your existing file
import fs from "fs";

class AudioController {
    async generateAudio(req, res) {
        console.log("=== GENERATE AUDIO REQUEST START ===");
        try {
            const { text } = req.body;
            console.log("Request text:", text);
            
            if (!text) { 
                console.log("No text provided");
                return res.status(400).send({ error: "Text is required" });
            }
            
            console.log("Generating speech...");
            const audioPath = await generateSpeech(text); // Same function call
            console.log("Audio generated at:", audioPath);

            // Check if file exists
            if (!fs.existsSync(audioPath)) {
                console.log("Audio file not found:", audioPath);
                return res.status(500).send({ error: "Audio file was not created" });
            }

            console.log("Sending audio file...");
            // Set proper headers
            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Content-Disposition", "inline; filename=speech.mp3");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            
            // Stream the file
            const fileStream = fs.createReadStream(audioPath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                console.error('Stream error:', error);
                res.status(500).send({ error: "Stream error" });
            });

            fileStream.on('end', () => {
                console.log("File stream ended successfully");
            });
            
        } catch (error) {
            console.error("Error in /generate-audio:", error);  
            res.status(500).send({ error: "Failed to generate audio speech: " + error.message });
        } finally {
            console.log("=== GENERATE AUDIO REQUEST END ===");
        }
    }
}

// Export an instance
const audioController = new AudioController();
export default audioController;