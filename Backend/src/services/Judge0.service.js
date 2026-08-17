import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Validate environment variables
if (!process.env.JUDGE0_API_KEY) {
    throw new Error('JUDGE0_API_KEY is not defined in environment variables');
}

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_API_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

class Judge0Service {
    static buildJudge0Error(error) {
        const status = error?.response?.status;
        const details = error?.response?.data?.error || error?.response?.data?.message || error.message;
        const judge0Error = new Error();

        if (status === 429) {
            const retryAfter = error?.response?.headers?.["retry-after"];
            judge0Error.message =
                retryAfter
                    ? `Judge0 rate limit reached. Please wait ${retryAfter} seconds and try again.`
                    : "Judge0 rate limit reached. Please wait a moment and try again.";
            judge0Error.statusCode = 429;
            return judge0Error;
        }

        if (status === 503) {
            judge0Error.message = "Judge0 queue is full right now. Please try again in a moment.";
            judge0Error.statusCode = 503;
            return judge0Error;
        }

        if (status === 400 && /wait not allowed/i.test(details || "")) {
            judge0Error.message = "Judge0 does not allow synchronous wait on this host. Falling back to async polling.";
            judge0Error.statusCode = 400;
            return judge0Error;
        }

        if (status) {
            judge0Error.message = `Judge0 API Error (${status}): ${details || "Unknown error"}`;
            judge0Error.statusCode = status;
            return judge0Error;
        }

        if (error?.request) {
            judge0Error.message = "No response from Judge0 API - check network connection";
            judge0Error.statusCode = 502;
            return judge0Error;
        }

        judge0Error.message = `Request setup failed: ${details || "Unknown error"}`;
        judge0Error.statusCode = 500;
        return judge0Error;
    }

    static async requestWithRetry(options, maxRetries = 2) {
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await axios.request(options);
            } catch (error) {
                lastError = error;
                if (error?.response?.status !== 429 || attempt === maxRetries) {
                    throw error;
                }

                const retryAfterHeader = Number(error?.response?.headers?.["retry-after"]);
                const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
                    ? retryAfterHeader * 1000
                    : 1000 * (attempt + 1);

                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        throw lastError;
    }

    /**
     * Create a new code submission
     * @param {string} sourceCode - The source code to execute
     * @param {number} languageId - Judge0 language ID
     * @param {string} stdin - Standard input (optional)
     * @returns {Promise<Object>} Submission data with token
     */
    static async createSubmission(sourceCode, languageId, stdin = '') {
        const options = {
            method: 'POST',
            url: JUDGE0_API_URL,
            params: { 
                base64_encoded: 'true', 
                fields: '*'  // Get all fields in response
            },
            headers: {  
                'content-type': 'application/json',
                'X-RapidAPI-Host': JUDGE0_API_HOST,
                'X-RapidAPI-Key': JUDGE0_API_KEY
            },
            data: {
                source_code: sourceCode ? Buffer.from(sourceCode).toString('base64') : '',
                language_id: languageId,
                stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
                // Optional: Add these for better control
                expected_output: '',
                cpu_time_limit: 2,
                memory_limit: 128000
            }
        };  
        
        try {
            const response = await this.requestWithRetry(options);
            
            // Validate response
            if (!response.data.token) {
                throw new Error('No token received from Judge0 API');
            }
            
            return response.data;
        } catch (error) {
            throw this.buildJudge0Error(error);
        }
    }

    /** Submit all challenge test cases with one Judge0 request. */
    static async createSubmissions(submissions) {
        if (!Array.isArray(submissions) || submissions.length === 0) {
            throw new Error('At least one submission is required');
        }

        const options = {
            method: 'POST',
            url: `${JUDGE0_API_URL}/batch`,
            params: { base64_encoded: 'true', fields: '*' },
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Host': JUDGE0_API_HOST,
                'X-RapidAPI-Key': JUDGE0_API_KEY
            },
            data: {
                submissions: submissions.map(({ sourceCode, languageId, stdin = '' }) => ({
                    source_code: sourceCode ? Buffer.from(sourceCode).toString('base64') : '',
                    language_id: Number(languageId),
                    stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
                    expected_output: '',
                    cpu_time_limit: 2,
                    memory_limit: 128000
                }))
            }
        };

        try {
            const response = await this.requestWithRetry(options);
            const created = Array.isArray(response.data) ? response.data : response.data?.submissions;
            if (!Array.isArray(created) || created.length !== submissions.length || created.some((item) => !item?.token)) {
                throw new Error('Judge0 batch submission did not return a token for every test case');
            }
            return created;
        } catch (error) {
            throw this.buildJudge0Error(error);
        }
    }

    /**
     * Get the result of a submission
     * @param {string} token - Submission token from createSubmission
     * @returns {Promise<Object>} Submission result data
     */
    static async getSubmissionResult(token) {
        if (!token) {
            throw new Error('Token is required to fetch submission result');
        }

        const options = {
            method: 'GET',
            url: `${JUDGE0_API_URL}/${token}`,
            params: { 
                base64_encoded: 'true',
                fields: '*'  // Get all fields
            },
            headers: {
                'X-RapidAPI-Host': JUDGE0_API_HOST,
                'X-RapidAPI-Key': JUDGE0_API_KEY
            }
        };
        
        try {
            const response = await this.requestWithRetry(options, 1);
            
            // Decode base64 fields if they exist
            if (response.data.stdout) {
                response.data.stdout = Buffer.from(response.data.stdout, 'base64').toString();
            }
            if (response.data.stderr) {
                response.data.stderr = Buffer.from(response.data.stderr, 'base64').toString();
            }
            if (response.data.compile_output) {
                response.data.compile_output = Buffer.from(response.data.compile_output, 'base64').toString();
            }
            
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Submission with token ${token} not found`);
            }
            throw this.buildJudge0Error(error);
        }
    }

    static async getSubmissionResults(tokens) {
        if (!Array.isArray(tokens) || tokens.length === 0 || tokens.some((token) => !token)) {
            throw new Error('Submission tokens are required to fetch batch results');
        }

        const options = {
            method: 'GET',
            url: `${JUDGE0_API_URL}/batch`,
            params: { base64_encoded: 'true', fields: '*', tokens: tokens.join(',') },
            headers: {
                'X-RapidAPI-Host': JUDGE0_API_HOST,
                'X-RapidAPI-Key': JUDGE0_API_KEY
            }
        };

        try {
            const response = await this.requestWithRetry(options, 1);
            const results = Array.isArray(response.data) ? response.data : response.data?.submissions;
            if (!Array.isArray(results) || results.length !== tokens.length) {
                throw new Error('Judge0 batch result response was incomplete');
            }

            return results.map((result) => {
                for (const field of ['stdout', 'stderr', 'compile_output']) {
                    if (result[field]) result[field] = Buffer.from(result[field], 'base64').toString();
                }
                return result;
            });
        } catch (error) {
            throw this.buildJudge0Error(error);
        }
    }

    /**
     * Helper: Get submission with polling (for async submissions)
     * @param {string} token - Submission token
     * @param {number} maxAttempts - Maximum polling attempts
     * @param {number} delayMs - Delay between attempts in ms
     */
    static async pollSubmissionResult(token, maxAttempts = 8, delayMs = 1500) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const result = await this.getSubmissionResult(token);
            
            // Judge0 status: 1=In Queue, 2=Processing, 3=Completed
            if (result.status.id > 2) {
                return result;
            }
            
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        throw new Error(`Submission ${token} timed out after ${maxAttempts} attempts`);
    }

    static async pollSubmissionResults(tokens, maxAttempts = 8, delayMs = 1000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const results = await this.getSubmissionResults(tokens);
            if (results.every((result) => Number(result?.status?.id) > 2)) return results;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        throw new Error(`Judge0 batch submission timed out after ${maxAttempts} attempts`);
    }
}

export default Judge0Service;
