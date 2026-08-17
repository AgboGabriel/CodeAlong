import youtubeVideoModel from "../models/youtubeVideoModel.js";
import curriculumModel from "../models/curriculumModel.js";
import bktModel from "../models/bktModel.js";
import BKTService from "./bkt.service.js";
import Judge0Service from "./Judge0.service.js";
import { groqService } from "./Chat.service.js";
import questionnaireService from "./questionnaire.service.js";
import youtubeService from "./youtubeService.js";
import challengeModel from "../models/challengeModel.js";
import dotenv from 'dotenv';
dotenv.config();
import {
  inferLanguageFromText,
  textMentionsDifferentSupportedLanguage,
} from "./languageContext.js";

const CHAT_SERVICE = new groqService();
const REPLACEMENT_VIDEO_FAILURE_THRESHOLD = 5;

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

function buildFallbackTests(topicTitle) {
  // Safe fallback: a trivial echo test that will always pass so the challenge
  // can at least be saved and shown to the learner.
  return [
    {
      id: "public_1",
      input: "hello",
      expectedOutput: "hello",
      explanation: `Fallback test for ${topicTitle}: output the input unchanged.`,
    },
  ];
}

// Each starter:
//   - reads the first line from stdin into a string variable ("input" / "input_val")
//   - also parses it as an integer ("n") so arithmetic challenges work without
//     the learner having to do the conversion themselves
//   - does NOT print anything on its own, so the output panel stays clean until
//     the learner adds their own cout/print/fmt.Println/etc.
const STDIN_STARTERS = {
  // `input` = raw string, `n` = parsed integer
  javascript:
    "const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');\n" +
    "const input = lines[0] || '';\n" +
    "const n = parseInt(input, 10);\n" +
    "// write your solution below\n",

  // `input_val` = raw string, `n` = parsed integer (falls back to string for non-numeric input)
  python:
    "import sys\n" +
    "input_val = sys.stdin.read().strip()\n" +
    "n = int(input_val) if input_val.lstrip('-').isdigit() else input_val\n" +
    "# write your solution below\n",

  // `input` = raw string, `n` = parsed int (0 if not numeric)
  java:
    "import java.util.Scanner;\n" +
    "public class Main {\n" +
    "    public static void main(String[] args) {\n" +
    "        Scanner sc = new Scanner(System.in);\n" +
    "        String input = sc.hasNextLine() ? sc.nextLine().trim() : \"\";\n" +
    "        int n = 0;\n" +
    "        try { n = Integer.parseInt(input); } catch (NumberFormatException e) {}\n" +
    "        // write your solution below\n" +
    "    }\n" +
    "}",

  // `n` = integer read directly from stdin
  cpp:
    "#include<iostream>\n" +
    "using namespace std;\n" +
    "int main(){\n" +
    "    int n;\n" +
    "    cin >> n;\n" +
    "    // write your solution below\n" +
    "    return 0;\n" +
    "}",

  // `input` = raw string (newline stripped), `n` = parsed int via atoi
  c:
    "#include<stdio.h>\n" +
    "#include<stdlib.h>\n" +
    "#include<string.h>\n" +
    "int main(){\n" +
    "    char input[1024] = \"\";\n" +
    "    fgets(input, sizeof(input), stdin);\n" +
    "    input[strcspn(input, \"\\n\")] = 0;\n" +
    "    int n = atoi(input);\n" +
    "    // write your solution below\n" +
    "    return 0;\n" +
    "}",

  // `input` = raw string, `n` = parsed int (0 if not numeric)
  csharp:
    "using System;\n" +
    "class Program {\n" +
    "    static void Main() {\n" +
    "        string input = Console.ReadLine() ?? \"\";\n" +
    "        int.TryParse(input.Trim(), out int n);\n" +
    "        // write your solution below\n" +
    "    }\n" +
    "}",

  // `input` = raw string (trimmed), `n` = parsed int64 (0 if not numeric)
  // NOTE: no fmt.Println() here — that was a bug that printed a blank line on every run
  go:
    "package main\n" +
    "import (\n" +
    "    \"bufio\"\n" +
    "    \"fmt\"\n" +
    "    \"os\"\n" +
    "    \"strconv\"\n" +
    "    \"strings\"\n" +
    ")\n" +
    "func main() {\n" +
    "    r := bufio.NewReader(os.Stdin)\n" +
    "    line, _ := r.ReadString('\\n')\n" +
    "    input := strings.TrimSpace(line)\n" +
    "    n, _ := strconv.ParseInt(input, 10, 64)\n" +
    "    _ = input\n" +
    "    _ = n\n" +
    "    _ = fmt.Sprintf // import kept available\n" +
    "    // write your solution below\n" +
    "}",

  // `input` = raw string, `n` = parsed integer (nil if not numeric)
  ruby:
    "input = ($stdin.gets || '').chomp\n" +
    "n = Integer(input) rescue nil\n" +
    "# write your solution below\n",

  // `input` = raw string, `n` = parsed i64 (0 if not numeric)
  rust:
    "use std::io::{self, BufRead};\n" +
    "fn main() {\n" +
    "    let stdin = io::stdin();\n" +
    "    let input = stdin.lock().lines().next()\n" +
    "        .unwrap_or(Ok(String::new())).unwrap();\n" +
    "    let n: i64 = input.trim().parse().unwrap_or(0);\n" +
    "    // write your solution below\n" +
    "}",
};

function mergeStarterCode(aiStarters = {}) {
  // Always use the platform's canonical stdin starter code.
  // AI-generated starter blocks may accidentally include full solutions,
  // so we ignore them and keep the safe placeholder implementation.
  return { ...STDIN_STARTERS };
}

function normalizeChallenge(challenge) {
  if (!challenge?.title || !challenge?.prompt) {
    throw new Error("Generated challenge is missing title or prompt");
  }

  const rawPublic = Array.isArray(challenge.publicTests) ? challenge.publicTests : [];
  const rawHidden = Array.isArray(challenge.hiddenTests) ? challenge.hiddenTests : [];

  // Keep only tests that have a non-empty expectedOutput
  const publicTests = rawPublic.filter(t => t?.expectedOutput != null && String(t.expectedOutput).trim() !== "");
  const hiddenTests = rawHidden.filter(t => t?.expectedOutput != null && String(t.expectedOutput).trim() !== "");

  // If still empty after filtering, use fallback instead of throwing
  const finalPublic = publicTests.length > 0 ? publicTests : buildFallbackTests(challenge.title);
  const finalHidden = hiddenTests;

  return {
    title: challenge.title,
    prompt: challenge.prompt,
    instructions: Array.isArray(challenge.instructions) ? challenge.instructions : [],
    expectedConcepts: Array.isArray(challenge.expectedConcepts)
      ? challenge.expectedConcepts
      : [],
    // Always use correct stdin starters - never trust the AI's raw starter code
    starterCodeByLanguage: mergeStarterCode(challenge.starterCodeByLanguage),
    publicTests: finalPublic.map((test, index) => ({
      id: test.id || `public_${index + 1}`,
      input: test.input ?? "",
      expectedOutput: String(test.expectedOutput ?? ""),
      explanation: test.explanation || "",
    })),
    hiddenTests: finalHidden.map((test, index) => ({
      id: test.id || `hidden_${index + 1}`,
      input: test.input ?? "",
      expectedOutput: String(test.expectedOutput ?? ""),
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
              "You are a JSON generator. Return only valid JSON. Generate prior-knowledge quiz questions that are topic-specific and diagnostic.",
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
          model: process.env.GROQ_MODEL_ID || "openai/gpt-oss-120b",
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 2000,
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

    // -- Cache lookup: reuse an existing challenge for this topic/user --
    // Skip cache if the stored challenge only has fallback tests (bad generation).
    const existing = await challengeModel.findLatestByTopicId(context.topic.id, userId);
    const isFallbackOnly = (ch) => {
      const tests = ch?.challenge_data?.publicTests || [];
      return tests.length > 0 && tests.every(t => String(t.explanation || "").startsWith("Fallback test for"));
    };
    // Also skip cache if the JS starter code uses prompt() or defines a function
    // without stdin reading - those challenges will always fail in Judge0.
    const hasBrokenStarterCode = (ch) => {
      const jsCode = ch?.challenge_data?.starterCodeByLanguage?.javascript || "";
      // prompt() — browser API, not available in Judge0 Node.js
      if (jsCode.includes("prompt(")) return true;
      // split('') — splits into individual characters instead of lines,
      // so input 'Hello' becomes ['H','e','l','l','o'] and lines[0] is 'H'
      if (jsCode.includes("split('')") || jsCode.includes('split("")')) return true;
      // Bare function without stdin reading — won't receive test case input
      if (jsCode.includes("function ") && !jsCode.includes("readFileSync") && !jsCode.includes("readline")) return true;
      return false;
    };
    if (existing?.challenge_data && !isFallbackOnly(existing) && !hasBrokenStarterCode(existing)) {
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

    const prompt = `Generate a coding challenge. Topic: "${topicTitle}". Module: "${moduleTitle}". Language: ${languageName}.

Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{"title":"string","prompt":"string","instructions":["string"],"expectedConcepts":["string"],"difficulty":"easy","starterCodeByLanguage":{"${languageName}":"<complete runnable solution in ${languageName}>"},"publicTests":[{"id":"test1","input":"","expectedOutput":""},{"id":"test2","input":"","expectedOutput":""}],"hiddenTests":[{"id":"test3","input":"","expectedOutput":""},{"id":"test4","input":"","expectedOutput":""},{"id":"test5","input":"","expectedOutput":""}],"structuralExpectations":{"requireFunction":false,"requireConditional":false,"requireLoop":false,"requireBranching":false,"minimumFunctions":0,"minimumConditionals":0,"minimumLoops":0},"source":"ai_generated_topic_aligned"}

MANDATORY RULES:
1. Only test concepts from "${topicTitle}". No advanced concepts.
2. Every starterCodeByLanguage value must be a minimal placeholder — just the language name and "// solution here". The real starter code is injected server-side and any AI-provided code beyond the placeholder will be ignored. Do NOT write actual code in starterCodeByLanguage.
3. publicTests: exactly 2 items (test1, test2). hiddenTests: exactly 3 items (test3, test4, test5). All expectedOutput values must be non-empty strings.
4. expectedOutput = the exact text printed to stdout, trailing whitespace trimmed.
5. source must equal "ai_generated_topic_aligned".
`;
    // -- LLM call with up to 3 retries --
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
                "You are a JSON generator. Return only valid JSON. Create a coding challenge aligned to the topic and runnable in Judge0.",
            },
            { role: "user", content: prompt + retryNote },
          ],
          {
            model: process.env.GROQ_MODEL_ID || "openai/gpt-oss-120b",
            temperature: 0.4 + attempt * 0.1,
            response_format: { type: "json_object" },
            max_tokens: 1500,
          }
        );

        const parsed = extractJson(llmContent);
        normalized = normalizeChallenge(parsed);
        break; // success - exit retry loop
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

  async maybeTriggerSimplerVideoForTopic({ userId, topicId, moduleId, curriculumId, evaluation }) {
    if (!userId || !topicId) return null;

    const failureCount = await challengeModel.countTopicWeaknesses({
      userId,
      topicId,
      weaknessType: "challenge_failure",
    });

    // Recommend again at 5, 10, 15, ... failures, rather than only once.
    if (
      failureCount < REPLACEMENT_VIDEO_FAILURE_THRESHOLD ||
      failureCount % REPLACEMENT_VIDEO_FAILURE_THRESHOLD !== 0
    ) {
      return null;
    }

    const topicContext = await curriculumModel.getTopicContext(topicId, userId);
    if (!topicContext) return null;

    const existingVideo = await youtubeVideoModel.findLatestByTopicId(topicId);

    const questionnaire = await questionnaireService.getQuestionnaireByUserId(userId);
    const careerPath = questionnaire?.career_path || "frontend";
    const skillLevel = questionnaire?.skill_level || "beginner";
    const expectedLanguage = youtubeService.inferLanguageFromContext(
      topicContext.curriculum?.title || "",
      topicContext.module?.title || "",
      topicContext.topic?.title || ""
    );

    const weaknessFocus = this._getVideoWeaknessFocus(evaluation);
    const fallbackQuery = `${topicContext.topic.title} ${weaknessFocus} beginner friendly ${expectedLanguage?.name || expectedLanguage?.key || "tutorial"} explained simply`;
    const fallbackSearch = await youtubeService.searchVideos(fallbackQuery, 6);

    const fallbackCandidates = await youtubeService.getVideoDetails(
      fallbackSearch.map((video) => video.videoId).filter(Boolean)
    );

    const rankedFallbacks = await youtubeService.rankVideos(fallbackCandidates, topicContext.topic.title, {
      expectedLanguage,
      excludedVideoIds: existingVideo ? [existingVideo.video_id || existingVideo.videoId] : [],
      focusTerms: this._getVideoWeaknessTerms(evaluation),
    });

    const fallbackVideo = rankedFallbacks[0];
    if (!fallbackVideo) return null;

    const savedVideo = await youtubeVideoModel.saveTopicVideo({
      userId,
      curriculumId: curriculumId || topicContext.curriculum?.id,
      moduleId: moduleId || topicContext.module?.id,
      topicId,
      video: fallbackVideo,
      replacement: {
        isReplacement: true,
        replacedVideoId: existingVideo?.id || null,
        reason: `Repeated challenge failure (${failureCount} attempts): a simpler video focused on ${weaknessFocus} is recommended`,
      },
    });

    return {
      topicId,
      replacedVideoId: existingVideo?.id || null,
      replacementVideoId: savedVideo?.id || null,
      video: savedVideo,
      reason: `Repeated challenge failure (${failureCount} attempts): a simpler video focused on ${weaknessFocus} is recommended`,
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

    // One batch POST plus shared polling, instead of a POST and many GETs for
    // every individual test case. This protects the limited Judge0 quota.
    const submissions = await Judge0Service.createSubmissions(
      testCases.map((testCase) => ({
        sourceCode,
        languageId: Number(languageId),
        stdin: testCase.input || "",
      }))
    );
    const judgeResults = await Judge0Service.pollSubmissionResults(
      submissions.map((submission) => submission.token),
      8,
      1000
    );
    const results = [];

    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      const result = judgeResults[index];

      // Improved decoding that works for all languages
      const stdout = this._decodeOutput(result.stdout);
      const stderr = this._decodeOutput(result.stderr);
      const compileOutput = this._decodeOutput(result.compile_output);
      
      // Check for execution errors
      const hasExecutionError = result.status && result.status.id >= 5 && result.status.id <= 14;
      const hasCompileError = compileOutput && compileOutput.trim().length > 0;
      const hasRuntimeError = stderr && stderr.trim().length > 0;
      
      // Compare outputs with flexible matching
      const passed = 
        !hasExecutionError &&
        !hasCompileError &&
        !hasRuntimeError &&
        this._compareOutputs(stdout || "", testCase.expectedOutput || "");

      results.push({
        id: testCase.id,
        passed,
        input: testCase.input || "",
        expectedOutput: testCase.expectedOutput || "",
        actualOutput: stdout || "",
        stderr: stderr || "",
        compileOutput: compileOutput || "",
        status: result.status,
        time: result.time,
        memory: result.memory,
        executionError: hasExecutionError,
        compileError: hasCompileError,
        runtimeError: hasRuntimeError,
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

    const bktUpdatedProbability = BKTService.updateMasteryProbability(
      Number(mastery.mastery_probability),
      isCorrect,
      Number(effectiveParams.p_guess),
      Number(effectiveParams.p_slip),
      Number(effectiveParams.p_learn)
    );

    // ── Challenge-pass override ─────────────────────────────────────────
    // Passing the section challenge IS the mastery demonstration. BKT's
    // gradual posterior can't jump from a low pretest prior to 0.80+ in one
    // shot, so we floor the stored mastery at the threshold whenever the
    // learner passes. The raw BKT value is still computed for analytics.
    const progressionThreshold = 0.80;
    const updatedProbability = isCorrect
      ? Math.max(bktUpdatedProbability, progressionThreshold)
      : bktUpdatedProbability;

    const updatedMastery = await bktModel.updateTopicMastery({
      userId,
      topicId,
      masteryProbability: updatedProbability,
      attempts: mastery.attempts + 1,
      correctAnswers: mastery.correct_answers + normalizedCorrect,
      incorrectAnswers: mastery.incorrect_answers + normalizedTotal - normalizedCorrect,
      lastQuizId: mastery.last_quiz_id || null,
    });

    let videoReplacement = null;
    if (evaluation.failed > 0) {
      await challengeModel.recordLearnerWeakness({
        userId,
        topicId,
        weaknessType: "challenge_failure",
        severity: 1.0,
        latestSubmissionId: savedSubmission?.id || null,
      });

      videoReplacement = await this.maybeTriggerSimplerVideoForTopic({
        userId,
        topicId,
        moduleId,
        curriculumId,
        evaluation,
      });
    }

    // Passing the challenge unlocks progression outright.
    const canProgress = isCorrect || Number(updatedProbability) >= progressionThreshold;

    let unlockResult = null;
    if (canProgress) {
      await curriculumModel.updateTopicStatus(topicId, "completed");
      unlockResult = await curriculumModel.unlockNextTopic(topicId, userId);
    }

    return {
      evaluation,
      submission: savedSubmission,
      mastery: updatedMastery,
      mastered: BKTService.isMastered(updatedProbability),
      canProgress,
      progressionThreshold,
      unlockResult,
      videoReplacement,
    };
  }

  // Helper method to decode Judge0 output
  _decodeOutput(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    try {
      // Try to decode as base64
      const decoded = Buffer.from(value, "base64").toString("utf8");
      // Check if decoded is readable text
      if (decoded && decoded.length > 0) {
        const printableChars = (decoded.match(/[\x20-\x7E\r\n]/g) || []).length;
        const ratio = printableChars / decoded.length;
        if (ratio > 0.8) {
          return decoded;
        }
      }
      return value;
    } catch (error) {
      return value;
    }
  }

  _getVideoWeaknessFocus(evaluation = {}) {
    const failedResults = (evaluation.results || []).filter((result) => !result.passed);
    if (failedResults.some((result) => result.compileError)) return "syntax and compiler errors";
    if (failedResults.some((result) => result.runtimeError || result.executionError)) return "debugging runtime errors";
    return "solving practice problems and matching expected output";
  }

  _getVideoWeaknessTerms(evaluation = {}) {
    const failedResults = (evaluation.results || []).filter((result) => !result.passed);
    if (failedResults.some((result) => result.compileError)) return ["syntax", "compiler error", "debugging"];
    if (failedResults.some((result) => result.runtimeError || result.executionError)) return ["runtime error", "debugging", "common mistakes"];
    return ["practice problems", "expected output", "worked example"];
  }

  // Helper method to compare outputs with flexible comparison
  _compareOutputs(actual, expected) {
    if (!actual && !expected) return true;
    if (!actual || !expected) return false;

    // Normalize both strings for comparison
    const normalize = (str) => {
      return str
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
    };

    const normalizedActual = normalize(actual);
    const normalizedExpected = normalize(expected);

    // Try exact match first
    if (normalizedActual === normalizedExpected) {
      return true;
    }

    // Try numeric comparison (for number outputs)
    const actualNum = parseFloat(normalizedActual);
    const expectedNum = parseFloat(normalizedExpected);
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      if (Math.abs(actualNum - expectedNum) < 0.000001) {
        return true;
      }
    }

    // Try removing all whitespace and comparing
    const stripAllWhitespace = (str) => str.replace(/\s/g, '');
    if (stripAllWhitespace(normalizedActual) === stripAllWhitespace(normalizedExpected)) {
      return true;
    }

    // Try case-insensitive comparison
    if (normalizedActual.toLowerCase() === normalizedExpected.toLowerCase()) {
      return true;
    }

    return false;
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
      model: process.env.GROQ_MODEL_ID || "openai/gpt-oss-120b",
      temperature: 0.4,
    });
  }
}

export default new AssessmentContentService();
