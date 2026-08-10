import axios from 'axios';
import dotenv from 'dotenv';
import { getAstLanguages } from "./astLanguageRegistry.js";
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
const EMBEDDED_IDE_LANGUAGE_TERMS = buildEmbeddedIdeLanguageTerms();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const SETUP_MODULE_PATTERN =
    /\b(setup|installation|install|environment setup|development environment|tooling setup|getting started with .* setup|configure|configuration)\b/i;

function buildEmbeddedIdeLanguageTerms() {
    const languages = getAstLanguages();
    const terms = new Set();

    for (const language of languages) {
        terms.add(language.key.toLowerCase());
        terms.add(language.monacoLanguage.toLowerCase());

        const normalizedName = language.name
            .replace(/\(.*?\)/g, "")
            .trim()
            .toLowerCase();

        terms.add(normalizedName);

        if (normalizedName.includes("c++")) {
            terms.add("c++");
            terms.add("cpp");
        }

        if (normalizedName === "c#") {
            terms.add("c#");
            terms.add("csharp");
            terms.add("c sharp");
        }

        if (normalizedName.includes("javascript")) {
            terms.add("javascript");
            terms.add("node.js");
            terms.add("nodejs");
        }

        if (normalizedName.includes("python")) {
            terms.add("python");
        }

        if (normalizedName.includes("java")) {
            terms.add("java");
        }

        if (normalizedName === "c") {
            terms.add("c language");
        }
    }

    return [...terms];
}

function requestTargetsEmbeddedIdeLanguage(topic) {
    const normalizedTopic = String(topic || "").toLowerCase();
    return EMBEDDED_IDE_LANGUAGE_TERMS.some((term) => normalizedTopic.includes(term));
}

function isSetupModule(module) {
    const title = `${module?.title || ""}`;
    const description = `${module?.desc || module?.description || ""}`;
    return SETUP_MODULE_PATTERN.test(`${title} ${description}`);
}

function removeLeadingSetupModuleIfNeeded(curriculum, topic) {
    if (!requestTargetsEmbeddedIdeLanguage(topic)) {
        return curriculum;
    }

    const modules = Array.isArray(curriculum.modules) ? [...curriculum.modules] : [];

    if (modules.length > 1 && isSetupModule(modules[0])) {
        modules.shift();
    }

    return {
        ...curriculum,
        modules: modules.map((module, index) => ({
            ...module,
            week: `Week ${index + 1}`,
        })),
    };
}


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
    const model = options.model || DEFAULT_GROQ_MODEL;
    const payload = {
        model,
        messages,
        temperature: options.temperature ?? 0.4,
    };

    if (options.response_format) {
        payload.response_format = options.response_format;
    }

    if (options.max_tokens) {
        payload.max_tokens = options.max_tokens;
    }

    const doPost = async (body) => {
        const response = await axios.post(this.apiUrl, body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return response.data.choices[0].message.content;
    };

    try {
        return await doPost(payload);
    } catch (error) {
        // Always log the real Groq error so we can see the actual message
        const groqErr = error.response?.data?.error;
        if (groqErr) {
            console.error(`Groq API error [${error.response.status}] on model ${model}:`, JSON.stringify(groqErr));
        }

        if (error.response?.status === 404 && !options.model) {
            for (const fallbackModel of FALLBACK_GROQ_MODELS.filter(item => item !== model)) {
                try {
                    console.warn(`Groq model ${model} is unavailable. Retrying with ${fallbackModel}.`);
                    return await doPost({ ...payload, model: fallbackModel });
                } catch (fallbackError) {
                    const fallbackErr = fallbackError.response?.data?.error;
                    if (fallbackErr) {
                        console.error(`Groq fallback error [${fallbackError.response?.status}] on model ${fallbackModel}:`, JSON.stringify(fallbackErr));
                    }
                }
            }
        }

        // If Groq rejects with 400 and response_format was set, retry without it
            if (error.response?.status === 400 && payload.response_format) {
            console.warn(`Retrying without response_format on model ${model}.`);
            await sleep(6000); // wait 6s before retry to avoid token exhaustion
            const { response_format, ...fallbackPayload } = payload;
            try {
                return await doPost(fallbackPayload);
            } catch (retryError) {
                const retryErr = retryError.response?.data?.error;
                if (retryErr) {
                    console.error(`Groq retry error [${retryError.response.status}]:`, JSON.stringify(retryErr));
                }
                throw retryError;
            }
        }

            // Also handle 429 explicitly — read the retry-after header:
        if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers?.['retry-after'] || '10', 10);
            console.warn(`Rate limited. Waiting ${retryAfter}s before retry...`);
            await sleep(retryAfter * 1000);
            try {
                return await doPost(payload);
            } catch (retryError) {
                throw retryError;
            }
        }
        throw error;
    }
}

async generateText(message, options = {}) {
    try {
        const messages = [];

        if (options.systemPrompt) {
            messages.push({ role: "system", content: options.systemPrompt });
        }

        if (Array.isArray(options.history) && options.history.length > 0) {
            messages.push(...options.history);
        }

        messages.push({ role: "user", content: message });

        return await this.generateChatCompletion(messages, options);
    } catch(error) {
        console.error('Error generating text with Groq API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async generateCurriculum(topic, options = {}) {
    try {
        const skipSetupModule = requestTargetsEmbeddedIdeLanguage(topic);
        const prompt = `
Create a structured learning curriculum for this learner request:
"${topic}"

Return only valid JSON. Do not wrap it in markdown. Do not add explanation outside the JSON.

The JSON must match this shape:
{
   "title": "A short curriculum title",
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
- Create a short professional curriculum title.
- Keep the title under 6 words.
- Create 4 to 6 modules.
- Keep titles short and practical.
- Use week labels like "Week 1", "Week 2", or "Week 3-4".
- Each module must have 3 to 6 topics.
- Use one of these colors: blue, purple, green, orange.
- Use simple icon names: terminal, layers, api, database, code, project.
${skipSetupModule ? "- Do not include an installation, setup, environment configuration, or tooling module because this learner will use an embedded IDE for this language." : ""}
`;

        const messages = [
            {
                role: "system",
                content: "You are CodeAlong's curriculum builder. You create practical programming learning paths as strict JSON."
            },
            { role: "user", content: prompt }
        ];
        const completionOptions = {
            model: options.model || DEFAULT_GROQ_MODEL,
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

        return this.parseCurriculumJson(content, topic);
    } catch(error) {
        console.error('Error generating curriculum with Groq API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

parseCurriculumJson(content, topic = "") {
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

    return this.normalizeCurriculum(parsed, topic);
}

normalizeCurriculum(curriculum, topic = "") {
    if (!curriculum || typeof curriculum !== "object") {
        throw new Error("Curriculum response must be an object");
    }

    if (!Array.isArray(curriculum.modules) || curriculum.modules.length === 0) {
        throw new Error("Curriculum response must include modules");
    }

    const normalizedCurriculum = {
        title:
        curriculum.title ||
        "Custom Learning Path",
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

    return removeLeadingSetupModuleIfNeeded(normalizedCurriculum, topic);
}
   
}