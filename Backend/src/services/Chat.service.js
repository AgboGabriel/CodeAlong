import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";


export class groqService {
    constructor() {
        this.apiKey= GROQ_API_KEY;
        this.apiUrl= GROQ_API_URL;
    
    if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables');
    }
    console.log('GROQ Service initialized with API Key');
}

async generateText(messages, options = {}) {
    try{ const model= options.model || 'llama-3.1-8b-instant';
    const response= await axios.post(this.apiUrl, {
        model: model,
        messages: [{role: "user", content: messages}]
},{
  headers:{
    'Content-Type': 'application/json',
    'Authorization':`Bearer ${this.apiKey}`
  }
}
    );
    return response.data.choices[0].message.content;


} catch(error){
    console.error('Error generating text with Groq API:', error.response ? error.response.data : error.message);
    throw error;
}
   
}}