import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Define log directory
const logDir = process.env.LOG_DIR || 'logs';

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: 'seo-audit-api' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
        }),
    ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                logFormat
            ),
        })
    );
}

// Morgan stream for HTTP logs
export const morganStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

export default logger;
