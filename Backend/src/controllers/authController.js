import passport from "passport";
import authService from "../services/authService.js";

function toPublicUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name ?? null,
        avatar_url: user.avatar_url ?? null,
        role: user.role,
        is_active: user.is_active,
        auth_provider: user.auth_provider,
        questionnaire_completed: user.questionnaire_completed,
        created_at: user.created_at,
        last_login: user.last_login,
    };
}

class AuthController {
    constructor() {
        this.authService = authService;
    }

    async register(req, res) {
        try {
            const { username, email, password, password_hash } = req.body;
            const newUser = await this.authService.registerUser({
                username,
                email,
                password_hash: password || password_hash,
            });

            req.login(newUser, (loginError) => {
                if (loginError) {
                    console.error("Error logging in after register:", loginError);
                    return res.status(500).json({ error: loginError.message });
                }

                return res.status(201).json({
                    message: "User registered and logged in successfully",
                    user: toPublicUser(newUser),
                });
            });
        } catch (error) {
            console.error("Error in register:", error);
            res.status(400).json({ error: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await this.authService.requestPasswordReset(email);

            return res.status(200).json({
                message: result.message,
                ...(process.env.NODE_ENV !== "production" && result.resetLink
                    ? { devResetLink: result.resetLink }
                    : {}),
                ...(process.env.NODE_ENV !== "production" && result.devReason
                    ? { devReason: result.devReason }
                    : {}),
            });
        } catch (error) {
            console.error("Error in forgotPassword:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword, password } = req.body;
            const result = await this.authService.resetPassword(token, newPassword || password);

            return res.status(200).json(result);
        } catch (error) {
            console.error("Error in resetPassword:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    login(req, res, next) {
        if (!req.body.password && req.body.password_hash) {
            req.body.password = req.body.password_hash;
        }

        passport.authenticate("local", (error, user, info) => {
            if (error) {
                console.error("Passport authentication error:", error);
                return next(error);
            }

            if (!user) {
                return res.status(401).json({
                    error: info?.message || "Authentication failed",
                });
            }

            req.login(user, (loginError) => {
                if (loginError) {
                    console.error("Error creating session:", loginError);
                    return next(loginError);
                }

                return res.status(200).json({
                    message: "Login successful",
                    user: toPublicUser(user),
                });
            });
        })(req, res, next);
    }

    logout(req, res, next) {
        req.logout((error) => {
            if (error) {
                console.error("Error in logout:", error);
                return next(error);
            }

            req.session.destroy((sessionError) => {
                if (sessionError) {
                    console.error("Error destroying session:", sessionError);
                    return next(sessionError);
                }

                res.clearCookie("connect.sid");
                return res.status(200).json({ message: "Logged out successfully" });
            });
        });
    }

    me(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        return res.status(200).json({ user: toPublicUser(req.user) });
    }
}

export default new AuthController();
