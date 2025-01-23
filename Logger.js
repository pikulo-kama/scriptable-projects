// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: file-alt;

const { Files } = importModule("Files");


/**
 * Log level enum.
 *
 * @class LogLevel
 */
class LogLevel {

    /**
     * States that service logging is turned off.
     *
     * @static
     * @memberof LogLevel
     */
    static OFF = "OFF";

    /**
     * For information messages.
     *
     * @static
     * @memberof LogLevel
     */
    static INFO = "INFO";

    /**
     * For non-critical warnings.
     *
     * @static
     * @memberof LogLevel
     */
    static WARN = "WARN";

    /**
     * For errors.
     *
     * @static
     * @memberof LogLevel
     */
    static ERROR = "ERROR";

    /**
     * For debugging messages.
     *
     * @static
     * @memberof LogLevel
     */
    static DEBUG = "DEBUG";
}


/**
 * Logger class.
 *
 * @class Logger
 */
class Logger {

    static #PLAIN_LOG_FILE_NAME = "scriptable.user.log";
    static #JSON_LOG_FILE_NAME = "scriptable.user.log.json";
    static #LEVELS_FILE_NAME = "levels.json";
    static #logLevels;

    /**
     * Log levels in their priority order.
     *
     * @memberof Logger
     */
    static #logLevelList = [
        LogLevel.OFF,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.DEBUG
    ];

    #service;
    #serviceLogginPriority;

    /**
     * Creates an instance of Logger.
     * 
     * @param {String} service name of service that is being logged.
     * @memberof Logger
     */
    constructor(service) {
        this.#service = service;
        this.#serviceLogginPriority = this.#getServiceLoggingPriority(service);
    }

    /**
     * Used to log informational event.
     *
     * @param {String} message message explaining event
     * @param {Object} data additional data related to event
     * @memberof Logger
     */
    info(message, data) {
        this.#log(LogLevel.INFO, message, data);
    }

    /**
     * Used to log warning.
     *
     * @param {String} message message explaining event
     * @param {Object} data additional data related to event
     * @memberof Logger
     */
    warn(message, data) {
        this.#log(LogLevel.WARN, message, data);
    }

    /**
     * Used to log error.
     *
     * @param {String} message message explaining event
     * @param {Object} data additional data related to event
     * @memberof Logger
     */
    error(message, data) {
        this.#log(LogLevel.ERROR, message, data);
    }

    /**
     * Used to log debugging information.
     *
     * @param {String} message message explaining event
     * @param {Object} data additional data related to event
     * @memberof Logger
     */
    debug(message, data) {
        this.#log(LogLevel.DEBUG, message, data);
    }

    /**
     * Used to log event.
     *
     * @param {LogLevel} level event log level
     * @param {String} message event message
     * @param {Object} [data={}] additional data related to event
     * @memberof Logger
     */
    #log(level, message, data = {}) {

        if (!this.#shouldBeLogged(level)) {
            return;
        }

        const log = {
            timestamp: new Date().toISOString(),
            level,
            service: this.#service,
            message,
            ...data
        };

        this.#saveToJSONFile(log);
        this.#saveToPlainFile(log);
    }

    /**
     * Used to save message to JSON log file.
     * 
     * @param {Object} log event log object
     */
    async #saveToJSONFile(log) {
        const jsonLogFile = Files.readJson(Logger.name, Logger.#JSON_LOG_FILE_NAME, {logs: []});

        jsonLogFile.logs.push(log);
        await Files.updateJson(Logger.name, Logger.#JSON_LOG_FILE_NAME, jsonLogFile);
    }

    /**
     * Used to save message to plain log file.
     * 
     * @param {Object} log event log object
     */
    async #saveToPlainFile(log) {

        let {
            timestamp,
            level,
            service,
            message
        } = log;

        delete log.timestamp;
        delete log.level;
        delete log.service;
        delete log.message;

        const dataArray = [];

        for (const key of Object.keys(log)) {
            dataArray.push(`${key}=${log[key]}`);
        }

        if (!message.endsWith(".")) {
            message += '.';
        }

        let logFile = Files.readFile(Logger.name, Logger.#PLAIN_LOG_FILE_NAME, "");
        const logMessage = `${timestamp} [${level}] [${service}] ${message} ${dataArray.join(", ")}\n`;

        logFile += logMessage;
        await Files.updateFile(Logger.name, Logger.#PLAIN_LOG_FILE_NAME, logFile);
    }

    /**
     * Used to check whether provided log level
     * should be logged for current logger.
     * 
     * @param {LogLevel} logLevel log level to check
     * @returns 
     */
    #shouldBeLogged(logLevel) {

        const logLevelPriority = Logger.#logLevelList.indexOf(logLevel);
        return logLevelPriority <= this.#serviceLogginPriority;
    }

    /**
     * Used to get logging priority of
     * current service.
     * 
     * @param {String} service service to get logging priority for
     * @returns 
     */
    #getServiceLoggingPriority(service) {
        const logLevels = this.#getLogLevels();
        let loggingLevel = logLevels.find(record => record.service === service)?.level;

        // Don't log if logging level is not set.
        if (!loggingLevel) {
            loggingLevel = LogLevel.OFF;
        }

        return Logger.#logLevelList.indexOf(loggingLevel);
    }

    /**
     * Used to get log levels configuration file.
     * 
     * @returns {Object} log levels JSON object
     */
    #getLogLevels() {

        if (!Logger.#logLevels) {
            Logger.#logLevels = Files.readJson(Logger.name, Logger.#LEVELS_FILE_NAME, []);
        }

        return Logger.#logLevels;
    }
}


/**
 * Used to get logger for end-scripts (not modules).
 * This shouldn't be used in modules since modules do not
 * contain their script name when imported.
 * 
 * @returns {Logger} instance of logger
 */
function getLogger() {
    return new Logger(Script.name());
}


module.exports = {
    getLogger,
    Logger,
    LogLevel
};
