import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import authService from "../services/authService.js";
import userModel from "../models/userModel.js";
import GoogleStrategy from "passport-google-oauth2";

export function configurePassport() {
    passport.use(
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
            },
            async (email, password, done) => {
                try {
                    const user = await authService.loginUser(email, password);
                    return done(null, user);
                } catch (error) {
                    return done(null, false, { message: error.message });
                }
            }
        )
    );

    passport.use(
        "google",
        new GoogleStrategy(
            {
                clientID: process.env.GoogleClientID,
                clientSecret: process.env.GoogleClientSecret,
                callbackURL: "http://localhost:3000/auth/google/callback",
                userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error("Google account did not return an email address"));
                    }

                    const existingGoogleUser = await userModel.findByGoogleId(profile.id);
                    if (existingGoogleUser) {
                        return done(null, existingGoogleUser);
                    }

                    const existingUserByEmail = await userModel.findByEmail(email);
                    if (existingUserByEmail) {
                        const updatedUser = await userModel.update(existingUserByEmail.id, {
                            google_id: profile.id,
                            auth_provider: "google",
                        });
                        return done(null, updatedUser);
                    }

                    const newUser = await userModel.createUser({
                        username: profile.displayName,
                        email,
                        auth_provider: "google",
                        google_id: profile.id,
                    });
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findUserByID(id);
            done(null, user || false);
        } catch (error) {
            done(error);
        }
    });
}

export default passport;
