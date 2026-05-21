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
                wait: 'true',
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
            const response = await axios.request(options);
            
            // Validate response
            if (!response.data.token) {
                throw new Error('No token received from Judge0 API');
            }
            
            return response.data;
        } catch (error) {
            // Improved error handling
            if (error.response) {
                // Judge0 API returned an error
                throw new Error(`Judge0 API Error (${error.response.status}): ${error.response.data.error || 'Unknown error'}`);
            } else if (error.request) {
                // No response received
                throw new Error('No response from Judge0 API - check network connection');
            } else {
                // Request setup error
                throw new Error(`Request setup failed: ${error.message}`);
            }
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
            const response = await axios.request(options);
            
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
            throw new Error(`Error fetching submission result: ${error.message}`);
        }
    }

    /**
     * Helper: Get submission with polling (for async submissions)
     * @param {string} token - Submission token
     * @param {number} maxAttempts - Maximum polling attempts
     * @param {number} delayMs - Delay between attempts in ms
     */
    static async pollSubmissionResult(token, maxAttempts = 10, delayMs = 1000) {
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
}

export default Judge0Service;