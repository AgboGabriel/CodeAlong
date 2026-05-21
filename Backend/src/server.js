import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import session from "express-session";
import passport from "./config/passport.js";
import routes from "./router/routes.js";
import { configurePassport } from "./config/passport.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000
const API_BASE="http://localhost:3000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../Frontend/dist');
const serveFrontend = fs.existsSync(frontendDistPath);
configurePassport();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

if (serveFrontend) {
    app.use(express.static(frontendDistPath));
}

// Routes
app.use('/', routes);

if (serveFrontend) {
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Audio endpoint: POST http://localhost:${PORT}/generate-audio`);
    if (serveFrontend) {
        console.log(`Serving frontend from ${frontendDistPath}`);
    } else {
        console.log('Frontend dist not found. Build the frontend with `npm run build` in Frontend to serve it from backend.');
    }
});
