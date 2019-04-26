const { createLogger, format, transports } = require('winston');
const { customErrorConfig, customMessagesConfig } = require('./configs/yp_custom_error');
let { customMessage, invalidName } = require('./utils/yp_normalize');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const inquirer = require("inquirer");
const chalk = require('chalk');

const env = process.env.NODE_ENV || 'development';
const logDir = process.env.HOME + '/.config/yappes/logs';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

let local = moment().format('YYYY-MM-DD HH:mm:ss');

let accessTransport = new transports.DailyRotateFile({
    filename: path.join(logDir, '%DATE%-access.log'),
    datePattern: 'DD-MM-YYYY',
    maxSize: '1m'
});
let errorTransport = new transports.DailyRotateFile({
    filename: path.join(logDir, '%DATE%-error.log'),
    datePattern: 'DD-MM-YYYY',
    maxSize: '1m'
});
const accessLogger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.printf(info => {
            return `${local},[${info.level}],${JSON.stringify(info.message)};`;
        })
    ),
    transports: [accessTransport]
});

const errorLogger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.printf(info => {
            return `${info.timestamp};[${info.level}];${JSON.stringify(info.message)}`;
        })
    ),
    transports: [errorTransport]
});


function YappesCliProcessor() {
    this.apiPath = {
        'login': function() {
            return "/token/auth/cli";
        }
    };
    this.resolvePath = "./commands/";
}


YappesCliProcessor.prototype.loadCommand = function(command) {
    let self = this;
    try {
        require.resolve(self.resolvePath + command);
        return require(self.resolvePath + command);
    } catch (e) {
        return false;
    }

}

YappesCliProcessor.prototype.executeCommand = function(command, inputData, callback) {
    let self = this;
    let clock = [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
    ];

    let counter = 0;
    let ui = new inquirer.ui.BottomBar();

    let tickInterval = setInterval(() => {
        ui.updateBottomBar(chalk.yellowBright(clock[counter++ % clock.length]));
    }, 250);
    let commandModule = self.loadCommand(command);
    if (typeof commandModule == "function") {

        if (self.apiPath[command]) {
            inputData["endPointPath"] = self.apiPath[command]();
        } else {
            inputData["endPointPath"] = "not-required";
        }
        try {
            commandModule(inputData, function(err, apiResults) {
                if (err) {
                    let logObject = {
                        "command": command,
                        "inputData": inputData,
                        "status": "error",
                        "errorMessage": err
                    };
                    errorLogger.error(logObject);
                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                    clearInterval(tickInterval);
                    ui.close();
                    callback(err);
                } else {
                    let logObject = {
                        "command": command,
                        "inputData": inputData,
                        "status": "success"
                    };
                    accessLogger.info(logObject);
                    clearInterval(tickInterval);
                    ui.close();
                    callback(null, apiResults);
                }
            });
        } catch (err) {
            let error = customErrorConfig().customError.RUNTIMEERR;
            error.errorMessage = err;
            clearInterval(tickInterval);
            ui.close();
            callback(customMessage(error));
        }
    } else {
        let logObject = {
            "command": command,
            "inputData": inputData,
            "status": "error",
            "errorMessage": 'Invalid Command'
        };
        errorLogger.error(logObject);
        clearInterval(tickInterval);
        ui.close();
        callback('Invalid Command');
    }

}

module.exports = YappesCliProcessor