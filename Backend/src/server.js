import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import session from "express-session";
import passport from "./config/passport.js";
import routes from "./router/routes.js";
import { configurePassport } from "./config/passport.js";


const app = express();
const PORT = process.env.PORT || 3000;

configurePassport();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use('/', routes);


// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Audio endpoint: POST http://localhost:${PORT}/generate-audio`);
});
