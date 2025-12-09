import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

redis.on('connect', () => {
    logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
    logger.error('❌ Redis error:', err);
});

export default redis;
