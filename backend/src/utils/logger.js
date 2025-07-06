import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'finai-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Clean up meta data - only show simple values
        const cleanMeta = {};
        Object.keys(meta).forEach(key => {
          if (typeof meta[key] === 'string' || typeof meta[key] === 'number') {
            cleanMeta[key] = meta[key];
          }
        });
        return `${timestamp} [${level}]: ${message}${
          Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : ''
        }`;
      })
    )
  }));
}

export default logger;
