import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

import { logger, morganStream } from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import auditRoutes from './routes/audit.routes.js';
import brandingRoutes from './routes/branding.routes.js';
import clientRoutes from './routes/client.routes.js';
import teamRoutes from './routes/team.routes.js';
import billingRoutes from './routes/billing.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import adminRoutes from './routes/admin.routes.js';
import healthRoutes from './routes/health.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
    app.use(Sentry.Handlers.requestHandler());
}

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { stream: morganStream }));

// Rate limiting
app.use(rateLimiter);

// Health check (before auth)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/admin', adminRoutes);

// Sentry error handler
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
