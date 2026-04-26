import passport from "passport";
import authService from "../services/authService.js";

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

            res.status(201).json({
                message: "User registered successfully",
                user: newUser,
            });
        } catch (error) {
            console.error("Error in register:", error);
            res.status(400).json({ error: error.message });
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
                    user,
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

        return res.status(200).json({ user: req.user });
    }
}

export default new AuthController();
