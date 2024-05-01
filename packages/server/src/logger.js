const {createLogger, transports, format} = require('winston');

const logger = createLogger({
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.prettyPrint(),
    ),
    transports: [
        new transports.Console({}),
    ],
});

module.exports = {
    logger: logger,
}
