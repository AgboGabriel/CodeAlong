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

async generateChatCompletion(messages, options = {}) {
    const model = options.model || 'llama-3.1-8b-instant';
    const payload = {
        model: model,
        messages,
        temperature: options.temperature ?? 0.4,
    };

    if (options.response_format) {
        payload.response_format = options.response_format;
    }

    const response = await axios.post(this.apiUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        }
    });

    return response.data.choices[0].message.content;
}

async generateText(message, options = {}) {
    try {
        return await this.generateChatCompletion(
            [{ role: "user", content: message }],
            options
        );
    } catch(error) {
        console.error('Error generating text with Groq API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async generateCurriculum(topic, options = {}) {
    try {
        const prompt = `
Create a structured learning curriculum for this learner request:
"${topic}"

Return only valid JSON. Do not wrap it in markdown. Do not add explanation outside the JSON.

The JSON must match this shape:
{
  "description": "A short summary of the curriculum.",
  "modules": [
    {
      "title": "Module title",
      "week": "Week 1",
      "desc": "A short module description.",
      "icon": "terminal",
      "color": "blue",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

Rules:
- Create 4 to 6 modules.
- Keep titles short and practical.
- Use week labels like "Week 1", "Week 2", or "Week 3-4".
- Each module must have 3 to 6 topics.
- Use one of these colors: blue, purple, green, orange.
- Use simple icon names: terminal, layers, api, database, code, project.
`;

        const messages = [
            {
                role: "system",
                content: "You are CodeAlong's curriculum builder. You create practical programming learning paths as strict JSON."
            },
            { role: "user", content: prompt }
        ];
        const completionOptions = {
            model: options.model || 'llama-3.1-8b-instant',
            temperature: options.temperature ?? 0.3,
            response_format: { type: "json_object" },
        };

        let content;
        try {
            content = await this.generateChatCompletion(messages, completionOptions);
        } catch (error) {
            if (error.response?.status !== 400) {
                throw error;
            }

            console.warn("Groq rejected response_format. Retrying curriculum generation without response_format.");
            const { response_format, ...retryOptions } = completionOptions;
            content = await this.generateChatCompletion(messages, retryOptions);
        }

        return this.parseCurriculumJson(content);
    } catch(error) {
        console.error('Error generating curriculum with Groq API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

parseCurriculumJson(content) {
    let parsed;

    try {
        parsed = JSON.parse(content);
    } catch (error) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI did not return valid curriculum JSON");
        }
        parsed = JSON.parse(jsonMatch[0]);
    }

    return this.normalizeCurriculum(parsed);
}

normalizeCurriculum(curriculum) {
    if (!curriculum || typeof curriculum !== "object") {
        throw new Error("Curriculum response must be an object");
    }

    if (!Array.isArray(curriculum.modules) || curriculum.modules.length === 0) {
        throw new Error("Curriculum response must include modules");
    }

    return {
        description: curriculum.description || "Your personalized learning path is ready.",
        modules: curriculum.modules.slice(0, 6).map((module, index) => ({
            title: module.title || `Module ${index + 1}`,
            week: module.week || `Week ${index + 1}`,
            desc: module.desc || module.description || "Work through the key ideas and practice with small exercises.",
            icon: module.icon || "terminal",
            color: module.color || "blue",
            topics: Array.isArray(module.topics) ? module.topics.slice(0, 6) : [],
        })),
    };
}
   
}
