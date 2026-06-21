import youtubeVideoModel from "../models/youtubeVideoModel.js";
import curriculumModel from "../models/curriculumModel.js";
import bktModel from "../models/bktModel.js";
import Judge0Service from "./Judge0.service.js";
import { groqService } from "./Chat.service.js";
import questionnaireService from "./questionnaire.service.js";
import youtubeService from "./youtubeService.js";
import challengeModel from "../models/challengeModel.js";
import {
  inferLanguageFromText,
  textMentionsDifferentSupportedLanguage,
} from "./languageContext.js";

const CHAT_SERVICE = new groqService();

const SUPPORTED_LANGUAGES = [
  { id: 63, key: "javascript", name: "JavaScript" },
  { id: 71, key: "python", name: "Python" },
  { id: 62, key: "java", name: "Java" },
  { id: 54, key: "cpp", name: "C++" },
  { id: 50, key: "c", name: "C" },
  { id: 51, key: "csharp", name: "C#" },
  { id: 60, key: "go", name: "Go" },
  { id: 72, key: "ruby", name: "Ruby" },
  { id: 73, key: "rust", name: "Rust" },
];

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

function extractJson(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

function normalizeQuizQuestion(question, index) {
  const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
  const correctIndex = Number(question.correctIndex);

  if (!question.question || options.length !== 4) {
    throw new Error(`Generated quiz question ${index + 1} is incomplete`);
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    throw new Error(`Generated quiz question ${index + 1} has an invalid correctIndex`);
  }

  return {
    id: `q_${index + 1}`,
    question: question.question,
    options,
    correctIndex,
    explanation: question.explanation || "",
    objective: question.objective || "",
  };
}

function tryNormalizeQuizQuestion(question, index) {
  try {
    return normalizeQuizQuestion(question, index);
  } catch (error) {
    return null;
  }
}

function buildFallbackQuizQuestions({
  existingQuestions = [],
  topicTitle,
  languageName,
  targetCount = 8,
}) {
  const questions = [...existingQuestions];
  const fallbackQuestions = [
    {
      question: `In ${languageName}, what is the main purpose of ${topicTitle}?`,
      options: [
        "To represent and work with a specific programming concept",
        "To install the programming language",
        "To replace the compiler",
        "To avoid writing source code",
      ],
      correctIndex: 0,
      explanation: `${topicTitle} is a language concept learners use while writing ${languageName} programs.`,
      objective: `Check basic understanding of ${topicTitle} in ${languageName}.`,
    },
    {
      question: `Which choice best describes a good ${languageName} learning approach for ${topicTitle}?`,
      options: [
        "Understand the concept and practice it in small programs",
        "Memorize unrelated syntax from another language",
        "Skip examples and only watch videos",
        "Focus only on installation steps",
      ],
      correctIndex: 0,
      explanation: `The goal is to apply ${topicTitle} directly in ${languageName} code.`,
      objective: `Confirm the learner can connect ${topicTitle} to practice.`,
    },
    {
      question: `When studying ${topicTitle} in ${languageName}, what should examples use?`,
      options: [
        `${languageName} syntax and conventions`,
        "Python syntax only",
        "HTML tags only",
        "Database queries only",
      ],
      correctIndex: 0,
      explanation: `Examples should stay in the same language as the curriculum.`,
      objective: "Check language alignment.",
    },
    {
      question: `Why is prior knowledge of ${topicTitle} useful before a ${languageName} lesson?`,
      options: [
        "It helps identify what the learner already understands",
        "It replaces the full lesson",
        "It removes the need to practice",
        "It guarantees mastery without coding",
      ],
      correctIndex: 0,
      explanation: "A prior-knowledge check is diagnostic, not a replacement for learning.",
      objective: "Check the purpose of prior-knowledge assessment.",
    },
  ];

  let fallbackIndex = 0;

  while (questions.length < targetCount) {
    const baseQuestion = fallbackQuestions[fallbackIndex % fallbackQuestions.length];
    questions.push({
      ...baseQuestion,
      id: `q_${questions.length + 1}`,
    });
    fallbackIndex += 1;
  }

  return questions.slice(0, targetCount).map((question, index) => ({
    ...question,
    id: `q_${index + 1}`,
  }));
}

function normalizeQuizQuestions(questions, { topicTitle, languageName, targetCount = 8 }) {
  const validQuestions = (Array.isArray(questions) ? questions : [])
    .map((question, index) => tryNormalizeQuizQuestion(question, index))
    .filter(Boolean);

  return buildFallbackQuizQuestions({
    existingQuestions: validQuestions.slice(0, targetCount),
    topicTitle,
    languageName,
    targetCount,
  });
}

function normalizeChallenge(challenge) {
  if (!challenge?.title || !challenge?.prompt) {
    throw new Error("Generated challenge is missing title or prompt");
  }

  const publicTests = Array.isArray(challenge.publicTests) ? challenge.publicTests : [];
  const hiddenTests = Array.isArray(challenge.hiddenTests) ? challenge.hiddenTests : [];

  if (publicTests.length === 0 && hiddenTests.length === 0) {
    throw new Error("Generated challenge must include at least one test case");
  }

  return {
    title: challenge.title,
    prompt: challenge.prompt,
    instructions: Array.isArray(challenge.instructions) ? challenge.instructions : [],
    expectedConcepts: Array.isArray(challenge.expectedConcepts)
      ? challenge.expectedConcepts
      : [],
    starterCodeByLanguage: challenge.starterCodeByLanguage || {},
    publicTests: publicTests.map((test, index) => ({
      id: test.id || `public_${index + 1}`,
      input: test.input ?? "",
      expectedOutput: test.expectedOutput ?? "",
      explanation: test.explanation || "",
    })),
    hiddenTests: hiddenTests.map((test, index) => ({
      id: test.id || `hidden_${index + 1}`,
      input: test.input ?? "",
      expectedOutput: test.expectedOutput ?? "",
    })),
    difficulty: challenge.difficulty || "medium",
    structuralExpectations: challenge.structuralExpectations || {},
    source: challenge.source || "ai_generated_topic_aligned",
  };
}

function compareOutput(actual = "", expected = "") {
  return actual.trim() === expected.trim();
}

function decodeBase64IfNeeded(value) {
  if (!value || typeof value !== "string") {
    return value || "";
  }

  try {
    return Buffer.from(value, "base64").toString();
  } catch (error) {
    return value;
  }
}

async function getTopicContext({ userId, topicId, moduleId = null }) {
  let topicContext = null;

  if (topicId) {
    topicContext = await curriculumModel.getTopicContext(topicId, userId);
  } else if (moduleId) {
    const module = await curriculumModel.getModuleWithTopics(moduleId, userId);
    if (module?.topics?.[0]) {
      topicContext = await curriculumModel.getTopicContext(module.topics[0].id, userId);
    }
  }

  if (!topicContext) {
    throw new Error("Topic context not found");
  }

  const expectedLanguage = inferLanguageFromText(
    topicContext.curriculum?.title,
    topicContext.module?.title,
    topicContext.topic?.title
  );
  let latestVideo = await youtubeVideoModel.findLatestByTopicId(topicContext.topic.id);

  if (
    latestVideo &&
    expectedLanguage &&
    !youtubeService.isVideoCompatibleWithLanguage(latestVideo, expectedLanguage)
  ) {
    latestVideo = null;
  }

  if (!latestVideo) {
    const questionnaire = await questionnaireService.getQuestionnaireByUserId(userId);
    const fetchedVideo = await youtubeService.findBestVideoForTopic({
      moduleTitle: topicContext.module.title,
      topic: topicContext.topic.title,
      skillLevel: questionnaire?.skill_level || "beginner",
      careerPath: questionnaire?.career_path || "software development",
      expectedLanguage,
    });

    if (fetchedVideo?.video) {
      latestVideo = await youtubeVideoModel.saveTopicVideo({
        userId,
        curriculumId: topicContext.module.curriculum_id,
        moduleId: topicContext.module.id,
        topicId: topicContext.topic.id,
        video: fetchedVideo.video,
      });
    }
  }

  return {
    ...topicContext,
    video: latestVideo || null,
    expectedLanguage,
  };
}

class AssessmentContentService {
  async generatePriorKnowledgeQuiz({ userId, topicId, moduleId = null }) {
    const context = await getTopicContext({ userId, topicId, moduleId });
    const topicTitle = context.topic.title;
    const moduleTitle = context.module.title;
    const videoTitle = context.video?.title || "No matched video yet";
    const videoDescription = context.video?.description || "No video description is available yet.";
    const languageName = context.expectedLanguage?.name || context.expectedLanguage?.key || "the curriculum language";

    const prompt = `
Generate a prior-knowledge quiz for a programming learner.

Return only valid JSON with this shape:
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "question": "string",
      "options": ["a", "b", "c", "d"],
      "correctIndex": 0,
      "explanation": "string",
      "objective": "string"
    }
  ]
}

Context:
- curriculum language: ${languageName}
- module title: ${moduleTitle}
- topic title: ${topicTitle}
- video title: ${videoTitle}
- video description: ${videoDescription}

Rules:
- Generate exactly 8 multiple-choice questions.
- The quiz must test prior knowledge for the specific topic, not generic programming trivia.
- Every question, option, code example, and explanation must use ${languageName}.
- Do not use examples from another programming language.
- Keep each question aligned to the topic and the video context.
- Use 4 options per question.
- Only one correct answer.
- Make distractors plausible.
- Questions should be beginner-to-intermediate and diagnostic.
- Avoid mentioning the video directly in the question text.
`;

    let parsed = null;

    let normalizedQuestions = [];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const content = await CHAT_SERVICE.generateChatCompletion(
        [
          {
            role: "system",
            content:
              "You generate strict JSON quizzes for programming prior-knowledge checks. Keep questions topic-specific, concise, diagnostic, and in the requested curriculum language.",
          },
          {
            role: "user",
            content:
              attempt === 0
                ? prompt
                : `${prompt}\n\nThe previous quiz used another programming language. Regenerate it using only ${languageName}.`,
          },
        ],
        {
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          response_format: { type: "json_object" },
        }
      );

      parsed = extractJson(content);
      normalizedQuestions = normalizeQuizQuestions(parsed.questions, {
        topicTitle,
        languageName,
      });

      if (
        normalizedQuestions.length === 8 &&
        (
          !context.expectedLanguage ||
          !textMentionsDifferentSupportedLanguage(JSON.stringify(parsed), context.expectedLanguage.key)
        )
      ) {
        break;
      }
    }

    return {
      title: parsed.title || `${topicTitle} Prior Knowledge Quiz`,
      description:
        parsed.description ||
        `A diagnostic quiz for ${topicTitle} based on the topic and lesson context.`,
      questions: normalizedQuestions,
      context: {
        topic: context.topic,
        module: context.module,
        video: context.video,
      },
    };
  }

  async generateTopicChallenge({ userId, topicId, moduleId = null }) {
    const context = await getTopicContext({ userId, topicId, moduleId });
    const topicTitle = context.topic.title;
    const moduleTitle = context.module.title;
    const videoTitle = context.video?.title || "No matched video yet";
    const videoDescription = context.video?.description || "No video description is available yet.";
    const languageName = context.expectedLanguage?.name || context.expectedLanguage?.key || "the curriculum language";

    // ── Cache lookup: reuse an existing challenge for this topic/user ──
    const existing = await challengeModel.findLatestByTopicId(context.topic.id, userId);
    if (existing?.challenge_data) {
      return {
        id: existing.id,
        ...existing.challenge_data,
        context: {
          topic: context.topic,
          module: context.module,
          video: context.video,
        },
        supportedLanguages: getSupportedLanguages(),
      };
    }

    const prompt = `
Generate one programming challenge that tests the learner's understanding of a single topic.

Return only valid JSON with this shape:
{
  "title": "string",
  "prompt": "string",
  "instructions": ["string"],
  "expectedConcepts": ["string"],
  "difficulty": "easy|medium",
  "starterCodeByLanguage": {
    "javascript": "string",
    "python": "string",
    "java": "string",
    "cpp": "string",
    "c": "string",
    "csharp": "string",
    "go": "string",
    "ruby": "string",
    "rust": "string"
  },
  "publicTests": [
    {
      "id": "string",
      "input": "string",
      "expectedOutput": "string",
      "explanation": "string"
    }
  ],
  "hiddenTests": [
    {
      "id": "string",
      "input": "string",
      "expectedOutput": "string"
    }
  ],
  "structuralExpectations": {
    "requireFunction": false,
    "requireConditional": false,
    "requireLoop": false,
    "requireBranching": false,
    "minimumFunctions": 0,
    "minimumConditionals": 0,
    "minimumLoops": 0
  },
  "source": "string"
}

Context:
- curriculum language: ${languageName}
- module title: ${moduleTitle}
- topic title: ${topicTitle}
- video title: ${videoTitle}
- video description: ${videoDescription}

Rules:
- The challenge must directly test the topic, not generic coding ability.
- The main challenge, examples, starter code, and tests must be for ${languageName}.
- Do not generate a challenge for another programming language.
- Use stdin/stdout style tests so the problem works across all supported languages.
- Include 2 public tests and 3 hidden tests. Every test MUST have a non-empty expectedOutput.
- Keep the problem small enough for a single lesson challenge.
- Starter code should be minimal and language-specific.
- Structural expectations should reflect the topic when possible.
- source must be "ai_generated_topic_aligned".
`;

    // ── LLM call with up to 3 retries ──
    let normalized = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const retryNote =
          attempt === 0
            ? ""
            : `\n\nPrevious attempt failed: ${lastError?.message}. You MUST include at least one publicTest and one hiddenTest, each with a non-empty expectedOutput.`;

        const llmContent = await CHAT_SERVICE.generateChatCompletion(
          [
            {
              role: "system",
              content:
                "You create strict JSON coding challenges for programming topics. Make the challenge tightly aligned to the topic and usable with Judge0 test execution.",
            },
            { role: "user", content: prompt + retryNote },
          ],
          {
            model: "llama-3.1-8b-instant",
            temperature: 0.4 + attempt * 0.1,
            response_format: { type: "json_object" },
          }
        );

        const parsed = extractJson(llmContent);
        normalized = normalizeChallenge(parsed);
        break; // success — exit retry loop
      } catch (err) {
        lastError = err;
        console.warn(`generateTopicChallenge attempt ${attempt + 1} failed: ${err.message}`);
      }
    }

    if (!normalized) {
      throw lastError || new Error("Failed to generate a valid challenge after 3 attempts");
    }

    const savedChallenge = await challengeModel.createTopicChallenge({
      userId,
      curriculumId: context.module.curriculum_id,
      moduleId: context.module.id,
      topicId: context.topic.id,
      challenge: normalized,
    });

    return {
      id: savedChallenge.id,
      ...normalized,
      context: {
        topic: context.topic,
        module: context.module,
        video: context.video,
      },
      supportedLanguages: getSupportedLanguages(),
    };
  }

  async evaluateChallengeSubmission({
    userId,
    challengeId,
    topicId,
    moduleId,
    curriculumId,
    sourceCode,
    languageId,
    testCases = [],
  }) {
    if (!userId) {
      throw new Error("User authentication is required");
    }

    if (!topicId) {
      throw new Error("topicId is required");
    }

    if (!sourceCode?.trim()) {
      throw new Error("source_code is required");
    }

    if (!languageId) {
      throw new Error("language_id is required");
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error("At least one test case is required for evaluation");
    }

    const results = [];

    for (const testCase of testCases) {
      const submission = await Judge0Service.createSubmission(
        sourceCode,
        Number(languageId),
        testCase.input || ""
      );

      const stdout = decodeBase64IfNeeded(submission.stdout);
      const stderr = decodeBase64IfNeeded(submission.stderr);
      const compileOutput = decodeBase64IfNeeded(submission.compile_output);
      const passed =
        !stderr &&
        !compileOutput &&
        compareOutput(stdout || "", testCase.expectedOutput || "");

      results.push({
        id: testCase.id,
        passed,
        input: testCase.input || "",
        expectedOutput: testCase.expectedOutput || "",
        actualOutput: stdout || "",
        stderr: stderr || "",
        compileOutput: compileOutput || "",
        status: submission.status,
        time: submission.time,
        memory: submission.memory,
      });
    }

    const evaluation = {
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      results,
    };

    let savedSubmission = null;
    if (challengeId) {
      savedSubmission = await challengeModel.createChallengeSubmission({
        challengeId,
        userId,
        sourceCode,
        languageId,
        evaluation,
      });
    }

    const params = await bktModel.getBktParameters(topicId);
    const effectiveParams = params || (await bktModel.createBktParameters(topicId));

    let mastery = await bktModel.getTopicMastery(userId, topicId);
    if (!mastery) {
      mastery = await bktModel.createTopicMastery(userId, topicId, effectiveParams.p_init, null);
    }

    const normalizedCorrect = evaluation.passed;
    const normalizedTotal = evaluation.total;
    const scoreForAttempt = BKTService.computeScore(normalizedCorrect, normalizedTotal);
    const correctnessThreshold = 0.7;
    const isCorrect = scoreForAttempt >= correctnessThreshold;

    const updatedProbability = BKTService.updateMasteryProbability(
      Number(mastery.mastery_probability),
      isCorrect,
      Number(effectiveParams.p_guess),
      Number(effectiveParams.p_slip),
      Number(effectiveParams.p_learn)
    );

    const updatedMastery = await bktModel.updateTopicMastery({
      userId,
      topicId,
      masteryProbability: updatedProbability,
      attempts: mastery.attempts + 1,
      correctAnswers: mastery.correct_answers + normalizedCorrect,
      incorrectAnswers: mastery.incorrect_answers + normalizedTotal - normalizedCorrect,
      lastQuizId: mastery.last_quiz_id || null,
    });

    if (evaluation.failed > 0) {
      await challengeModel.recordLearnerWeakness({
        userId,
        topicId,
        weaknessType: "challenge_failure",
        severity: 1.0,
        latestSubmissionId: savedSubmission?.id || null,
      });
    }

    if (isCorrect || BKTService.isMastered(updatedProbability)) {
      await curriculumModel.updateTopicStatus(topicId, "completed");
    }

    const progressionThreshold = 0.80;
    const canProgress = Number(updatedProbability) >= progressionThreshold;

    return {
      evaluation,
      submission: savedSubmission,
      mastery: updatedMastery,
      mastered: BKTService.isMastered(updatedProbability),
      canProgress,
      progressionThreshold,
    };
  }

  async buildLessonChatReply({
    message,
    topicTitle,
    moduleTitle,
    videoTitle,
    videoDescription,
    codeSnippet,
    languageName,
    conversationHistory = [],
  }) {
    const messages = [
      {
        role: "system",
        content: `You are CodeAlong's lesson assistant. Help the learner with the current topic, the current lesson video, and their code. Be concise, practical, and educational.

Current lesson context:
- module: ${moduleTitle || "Unknown module"}
- topic: ${topicTitle || "Unknown topic"}
- video title: ${videoTitle || "No video selected"}
- video description: ${videoDescription || "No video description available"}
- selected language: ${languageName || "Unknown language"}
- current code:
${codeSnippet || "No code provided"}
`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: message,
      },
    ];

    return CHAT_SERVICE.generateChatCompletion(messages, {
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
    });
  }
}

export default new AssessmentContentService();