
import Judge0Service from "../services/Judge0.service.js";

class Judge0Controller {
    /**
     * Compile and execute code
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async compileCode(req, res) {
        try {
            const { source_code, language_id, stdin } = req.body;

            // Validate required fields
            if (!source_code || !language_id) {
                return res.status(400).json({
                    success: false,
                    error: 'source_code and language_id are required'
                });
            }

            // Create submission
            const submission = await Judge0Service.createSubmission(
                source_code,
                parseInt(language_id),
                stdin || ''
            );

            // Return token for async processing or immediate result
            res.status(201).json({
                success: true,
                message: 'Code submitted successfully',
                data: {
                    token: submission.token,
                    status: submission.status,
                    // Include result if wait:true was used
                    ...(submission.stdout && { output: submission.stdout }),
                    ...(submission.stderr && { error: submission.stderr })
                }
            });

        } catch (error) {
            console.error('Compilation error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Get submission result by token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getResult(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Token is required'
                });
            }

            const result = await Judge0Service.getSubmissionResult(token);

            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    status: result.status,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    compile_output: result.compile_output,
                    time: result.time,
                    memory: result.memory
                }
            });

        } catch (error) {
            console.error('Get result error:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Compile with polling (for async submissions)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async compileWithPolling(req, res) {
        try {
            const { source_code, language_id, stdin } = req.body;

            if (!source_code || !language_id) {
                return res.status(400).json({
                    success: false,
                    error: 'source_code and language_id are required'
                });
            }

            // Create submission without wait
            const submission = await Judge0Service.createSubmission(
                source_code,
                parseInt(language_id),
                stdin || ''
            );

            // Poll for result (using helper from improved service)
            const result = await Judge0Service.pollSubmissionResult(
                submission.token,
                10,  // max attempts
                1000 // delay between attempts (ms)
            );

            res.status(200).json({
                success: true,
                message: 'Code executed successfully',
                data: {
                    token: result.token,
                    status: result.status,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    compile_output: result.compile_output,
                    time: result.time,
                    memory: result.memory
                }
            });

        } catch (error) {
            console.error('Polling compilation error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Get supported languages
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getLanguages(req, res) {
        try {
            // You could call Judge0 languages API here
            // Or define static languages list
            const languages = [
                { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
                { id: 71, name: 'Python (3.8.1)' },
                { id: 62, name: 'Java (OpenJDK 11.0.4)' },
                { id: 54, name: 'C++ (GCC 9.2.0)' },
                { id: 50, name: 'C (GCC 9.2.0)' },
                { id: 51, name: 'C# (Mono 6.6.0.161)' },
                { id: 60, name: 'Go (1.13.5)' },
                { id: 72, name: 'Ruby (2.7.0)' },
                { id: 73, name: 'Rust (1.40.0)' }
            ];

            res.status(200).json({
                success: true,
                data: languages
            });

        } catch (error) {
            console.error('Get languages error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
}

export default Judge0Controller;