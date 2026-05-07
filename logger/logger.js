const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require("../config/env.config")

// Define the log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Specify the format for the timestamp
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);


// Specify the directory for log files
const logDir =   path.join(config.LOGS_DIR);
const logFile =  config.LOGS_FILENAME;



// Create a logger instance
const logger = winston.createLogger({
    level: 'info', // Set log level
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        new DailyRotateFile({
            filename: path.join(logDir, logFile+'_logfile-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m', // Rotate after the file reaches 20 MB in size
            maxFiles: '14d', // Retain logs for 14 days
            dirname: logDir // Specify the directory for log files
        })
    ]
});

// Function to change log level at runtime
function setLogLevel(level) {
    logger.level = level;
    logger.info(`Log level changed to ${level}`);
}

module.exports = { logger, setLogLevel };
