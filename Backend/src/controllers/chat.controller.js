import chatModel from "../models/Chatmodel.js";


const HISTORY_WINDOW = 8;

const MAX_STORED_MESSAGES = 20;

export class ChatController {
  constructor(groqService) {
    this.groqService = groqService;
    console.log("Chat Controller initialized (DB-backed)");
  }

 
  async _getOrCreateConversation(userId, context = "general") {
    let conversation = await chatModel.getLatestConversation({ userId, context });
    if (!conversation) {
      conversation = await chatModel.createConversation({ userId, context });
    }
    return conversation;
  }

 
  async _getRecentHistory(conversationId) {
    const rows = await chatModel.getMessages(conversationId, HISTORY_WINDOW);
    return rows.map((row) => ({
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
    }));
  }

  validateInput(message) {
    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }
    if (message.trim().length === 0) {
      throw new Error("Message cannot be empty or whitespace");
    }
    if (message.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }
    if (this.containsInappropriateContent(message)) {
      throw new Error("Message contains inappropriate content");
    }
  }

  containsInappropriateContent(message) {
    const blockedTerms = [];
    const lower = message.toLowerCase();
    return blockedTerms.some((term) => lower.includes(term));
  }

  createErrorResponse(error) {
    let statusCode = 500;
    let userMessage = "An error occurred while processing your request";

    if (
      error.message.includes("Message must be") ||
      error.message.includes("Message cannot be") ||
      error.message.includes("Message too long")
    ) {
      statusCode = 400;
      userMessage = error.message;
    } else if (error.message.includes("inappropriate content")) {
      statusCode = 403;
      userMessage = error.message;
    } else if (
      error.message.includes("GROQ_API_KEY") ||
      error.message.includes("Failed to generate text") ||
      error.response
    ) {
      statusCode = 503;
      userMessage = "AI service is currently unavailable. Please try again later.";
    }

    return {
      success: false,
      error: userMessage,
      statusCode,
      internalError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      timestamp: new Date().toISOString(),
    };
  }

 

  /** General chat — persists to DB, uses recent history as context. */
  async processMessage(userId, message, options = {}) {
    try {
      this.validateInput(message);

      const conversation = await this._getOrCreateConversation(userId, "general");

      // Save the user message
      await chatModel.addMessage({
        conversationId: conversation.id,
        userId,
        role: "user",
        content: message,
      });

      // Build context window for the LLM (excludes the message we just added)
      const history = await this._getRecentHistory(conversation.id);
      // The message we just stored is already the last item; slice it off so
      // we don't double-send it (generateText appends it internally)
      const priorHistory = history.slice(0, -1);

      const aiResponse = await this.groqService.generateText(message, {
        ...options,
        history: priorHistory,
      });

      // Save the assistant reply
      await chatModel.addMessage({
        conversationId: conversation.id,
        userId,
        role: "assistant",
        content: aiResponse,
      });

      // Trim if we've gone over the cap
      await chatModel.trimMessages(conversation.id, MAX_STORED_MESSAGES);

      return {
        success: true,
        message: aiResponse,
        conversationId: conversation.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("ChatController.processMessage error:", error.message);
      return this.createErrorResponse(error);
    }
  }

  /** Curriculum builder — persists conversation + structured curriculum data. */
  async buildCurriculum(userId, message, options = {}) {
    try {
      this.validateInput(message);

      const conversation = await this._getOrCreateConversation(userId, "curriculum");

      // Save the user message
      await chatModel.addMessage({
        conversationId: conversation.id,
        userId,
        role: "user",
        content: message,
      });

      const curriculum = await this.groqService.generateCurriculum(message, options);

      // Save the assistant reply — store the raw JSON as content AND in
      // curriculum_data so it can be queried/displayed without re-parsing
      await chatModel.addMessage({
        conversationId: conversation.id,
        userId,
        role: "assistant",
        content: JSON.stringify(curriculum),
        curriculumData: curriculum,
      });

      await chatModel.trimMessages(conversation.id, MAX_STORED_MESSAGES);

      return {
        success: true,
        curriculum,
        conversationId: conversation.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("ChatController.buildCurriculum error:", error.message);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Build a rich system prompt from video metadata so the AI has full
   * context about what the lesson covers before the user asks anything.
   */
  buildVideoSystemPrompt({ video, topic } = {}) {
    const lines = [
      "You are a helpful coding tutor embedded inside a video lesson page.",
      "Answer questions about the current lesson, explain concepts clearly, and help debug code.",
      "Be concise, educational, and refer to the video content when relevant.",
      "",
    ];

    if (topic?.title) {
      lines.push(`## Current Topic`);
      lines.push(`The student is studying: "${topic.title}".`);
      lines.push("");
    }

    if (video) {
      lines.push(`## Lesson Video`);

      if (video.title) {
        lines.push(`**Title:** ${video.title}`);
      }

      if (video.channel_title || video.channelTitle) {
        lines.push(`**Channel:** ${video.channel_title || video.channelTitle}`);
      }

      if (video.duration) {
        lines.push(`**Duration:** ${video.duration}`);
      }

      if (video.description) {
        // YouTube descriptions can be very long; truncate to keep the prompt lean
        const desc = video.description.length > 1500
          ? video.description.slice(0, 1500) + "…"
          : video.description;

        lines.push("");
        lines.push(`**Video Description (what this lesson covers):**`);
        lines.push(desc);
      }

      lines.push("");
      lines.push(
        "Use the video title, channel, and description above to answer questions like " +
        "'what does this video cover?', 'what will I learn?', or 'what happens at a certain point in the video?'. " +
        "When the description mentions timestamps (e.g. 0:00, 2:30), use them to answer questions about specific sections."
      );
    }

    return lines.join("\n");
  }

  /** Return full message history for a user's most recent conversation. */
  async getConversation(userId, context = "general") {
    try {
      const conversation = await chatModel.getLatestConversation({ userId, context });
      if (!conversation) return [];

      const messages = await chatModel.getMessages(conversation.id);
      return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        curriculumData: msg.curriculum_data ?? undefined,
        timestamp: msg.created_at,
      }));
    } catch (error) {
      console.error("ChatController.getConversation error:", error.message);
      return [];
    }
  }

  /** Clear messages for the user's current conversation. */
  async clearConversation(userId, context = "general") {
    try {
      const conversation = await chatModel.getLatestConversation({ userId, context });
      if (conversation) {
        await chatModel.clearMessages(conversation.id, userId);
      }
      return {
        success: true,
        message: "Conversation history cleared",
        userId,
        hadPreviousConversation: !!conversation,
      };
    } catch (error) {
      console.error("ChatController.clearConversation error:", error.message);
      return { success: false, error: error.message };
    }
  }
}