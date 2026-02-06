export class ChatController {
    constructor(groqService) {
        this.groqService = groqService;
        
        // Store conversations (in production, use database)
        this.conversations = new Map();
        
        console.log('Chat Controller initialized');
    }
    
    /**
     * Process a chat message
     */
    async processMessage(userId, message, options = {}) {
        try {
            console.log('ChatController.processMessage called:', { 
                userId, 
                message: message ? `"${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"` : 'null',
                options 
            });
            
            // 1. Validate input
            console.log('Validating input...');
            this.validateInput(message);
            console.log('Input validated');
            
            // 2. Get conversation history
            console.log(' Getting conversation for userId:', userId);
            const conversation = this._getConversationArray(userId);
            console.log(' Conversation history length:', conversation.length);
            
            // 3. Add message to history
            console.log('Adding user message to history');
            conversation.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });
            
            // 4. Generate response using service
            console.log('Calling groqService.generateText()');
            const aiResponse = await this.groqService.generateText(message, options);
            console.log('Groq API response received');
            
            // 5. Add AI response to history
            conversation.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            });
            
            // 6. Limit conversation history
            this._limitConversationHistory(conversation);
            
            // 7. Return formatted response
            const response = {
                success: true,
                message: aiResponse,
                conversationId: userId,
                timestamp: new Date().toISOString(),
                historyLength: conversation.length
            };
            
            console.log('Request processed successfully');
            return response;
            
        } catch (error) {
            console.error('ChatController error in processMessage:');
            console.error('- Error type:', error.constructor.name);
            console.error('- Error message:', error.message);
            console.error('- Error stack:', error.stack);
            
            // If it's a Groq API error, log more details
            if (error.response) {
                console.error('- Groq API Error Status:', error.response.status);
                console.error('- Groq API Error Data:', error.response.data);
            }
            
            return this.createErrorResponse(error);
        }
    }
    
    /**
     * Validate user input
     */
    validateInput(message) {
        console.log('validateInput called with:', typeof message, message);
        
        if (!message || typeof message !== 'string') {
            console.error(' Validation failed: Message is not a string or is null');
            throw new Error('Message must be a non-empty string');
        }
        
        if (message.trim().length === 0) {
            console.error(' Validation failed: Message is empty or whitespace');
            throw new Error('Message cannot be empty or whitespace');
        }
        
        if (message.length > 5000) {
            console.error(' Validation failed: Message too long');
            throw new Error('Message too long (max 5000 characters)');
        }
        
        // Optional: Add content moderation
        if (this.containsInappropriateContent(message)) {
            console.error('Validation failed: Inappropriate content');
            throw new Error('Message contains inappropriate content');
        }
        
        console.log('Message validation passed');
    }
    
    /**
     * Get or create conversation ARRAY (private method)
     */
    _getConversationArray(userId) {
        console.log('_getConversationArray called for userId:', userId);
        
        if (!this.conversations.has(userId)) {
            console.log('Creating new conversation for userId:', userId);
            this.conversations.set(userId, []);
        } else {
            console.log('Existing conversation found for userId:', userId);
        }
        
        const conversation = this.conversations.get(userId);
        console.log('Returning conversation array with length:', conversation.length);
        return conversation;
    }
    
    /**
     * Limit conversation history (private method)
     */
    _limitConversationHistory(conversation, maxMessages = 20) {
        if (conversation.length > maxMessages) {
            console.log(`Limiting conversation from ${conversation.length} to ${maxMessages} messages`);
            // Remove oldest messages, keep recent ones
            conversation.splice(0, conversation.length - maxMessages);
        }
    }
    
    /**
     * Simple content check (expand as needed)
     */
    containsInappropriateContent(message) {
        const blockedTerms = [
            // Add terms you want to block
        ];
        
        const lowerMessage = message.toLowerCase();
        return blockedTerms.some(term => lowerMessage.includes(term));
    }
    
    /**
     * Create standardized error response
     */
    createErrorResponse(error) {
        console.log('createErrorResponse called for error:', error.message);
        
        let statusCode = 500;
        let userMessage = 'An error occurred while processing your request';
        
        if (error.message.includes('Message must be') || 
            error.message.includes('Message cannot be') ||
            error.message.includes('Message too long')) {
            statusCode = 400; // Bad request
            userMessage = error.message;
            console.log('Setting statusCode to 400 (Bad Request)');
        } else if (error.message.includes('inappropriate content')) {
            statusCode = 403; // Forbidden
            userMessage = error.message;
            console.log('Setting statusCode to 403 (Forbidden)');
        } else if (error.message.includes('GROQ_API_KEY') || 
                   error.message.includes('Failed to generate text') ||
                   error.response) {
            statusCode = 503; // Service unavailable
            userMessage = 'AI service is currently unavailable. Please try again later.';
            console.log('Setting statusCode to 503 (Service Unavailable)');
        }
        
        const errorResponse = {
            success: false,
            error: userMessage,
            statusCode: statusCode,
            internalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        };
        
        console.log('Error response created:', errorResponse);
        return errorResponse;
    }
    
    /**
     * Get conversation history for API response
     */
    getConversationHistory(userId) {
        console.log('getConversationHistory called for userId:', userId);
        
        const conversation = this._getConversationArray(userId);
        const response = {
            userId: userId,
            messages: conversation.map(msg => ({
                role: msg.role,
                content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
                timestamp: msg.timestamp
            })),
            totalMessages: conversation.length,
            lastUpdated: conversation.length > 0 ? conversation[conversation.length - 1].timestamp : null
        };
        
        console.log('Returning conversation history with', conversation.length, 'messages');
        return response;
    }
    
    /**
     * Clear conversation history
     */
    clearConversation(userId) {
        console.log('clearConversation called for userId:', userId);
        
        const hadConversation = this.conversations.has(userId);
        this.conversations.delete(userId);
        
        const response = {
            success: true,
            message: 'Conversation history cleared',
            userId: userId,
            hadPreviousConversation: hadConversation
        };
        
        console.log('Conversation cleared for userId:', userId);
        return response;
    }
    
    /**
     * Get conversation - alias for your route (returns the array)
     */
    getConversation(userId) {
        console.log('getConversation (public) called for userId:', userId);
        const conversation = this._getConversationArray(userId);
        
        // Return the full conversation array for the route
        return conversation.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
        }));
    }
    
    /**
     * Generate multiple responses (for testing/options)
     */
    async generateMultiple(prompt, variations = 3) {
        console.log('generateMultiple called with prompt:', prompt.substring(0, 50));
        
        const responses = [];
        
        for (let i = 0; i < variations; i++) {
            try {
                console.log(`Generating variation ${i + 1}/${variations}`);
                const response = await this.groqService.generateText(prompt, {
                    temperature: 0.7 + (i * 0.1), // Different creativity levels
                    model: 'llama-3.1-8b-instant'
                });
                responses.push({
                    variation: i + 1,
                    temperature: 0.7 + (i * 0.1),
                    content: response
                });
                console.log(`Variation ${i + 1} completed`);
            } catch (error) {
                console.error(`Error in variation ${i + 1}:`, error.message);
                responses.push({
                    variation: i + 1,
                    error: error.message
                });
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('All variations generated');
        return responses;
    }
}