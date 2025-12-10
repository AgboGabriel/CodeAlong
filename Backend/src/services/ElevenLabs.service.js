
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY // Defaults to process.env.ELEVENLABS_API_KEY
});
export  async function generateSpeech(text){
    try{
    const voiceID="Xb7hH8MSUJpSbSDYk0k2";
    const audio = await elevenlabs.textToSpeech.convert(voiceID, {
        text, 
        modelId: "eleven_multilingual_v2",
    });
    //converting readable stream to buffer
     const chunks = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
    const filePath =path.resolve(  "output.mp3");
    fs.writeFileSync(filePath, buffer);
    console.log(`Audio saved to ${filePath}`);
    return filePath;
    }catch(error){
        console.error("Error generating speech:", error);
        throw error;
    }
   
}


