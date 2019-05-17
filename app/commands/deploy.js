const fs = require('fs');
const util = require('util');
const async = require('async');
const inquirer = require('inquirer');
const chalk = require('chalk');
const netrc = require('../utils/netrc');
const { configs } = require('../configs/yp_configs');
const ypRequest = require('../utils/yp_request');
const { normalize, customMessage } = require('../utils/yp_normalize');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');


module.exports = function (processingData, callback) {
  const updateBusinessLogicData = {
    endpointReference: '',
    businessLogic: '',
    lastModifiedDateTime: '',
  };
  let pathEndPoint = '';
  let pathYpSetting = '';
  let ypSettings = '';
  let businesslogicFile = '';
  const clock = [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
  ];

  let counter = 0;
  const ui = new inquirer.ui.BottomBar();

  const tickInterval = setInterval(() => {
    ui.updateBottomBar(chalk.yellowBright(clock[counter++ % clock.length]));
  }, 250);
  const netrcObj = netrc();
  let loginUser = '';

  async.waterfall([
    function (callback) {
      const hostObj = configs().getHostDetails();
      if (netrcObj.hasOwnProperty(hostObj.host)) {
        loginUser = netrcObj[hostObj.host].login;
        callback(null);
      } else {
        ui.updateBottomBar(chalk.bgRedBright('✗ Failed... \n'));
        clearInterval(tickInterval);
        ui.close();
        callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
      }
    },
    function (callback) {
      if (processingData.endPointName != undefined) {
        configs().getConfigSettings((err, data) => {
          if (err) {
            callback(err);
          } else {
            pathEndPoint = `${decodeURIComponent(JSON.parse(data).path) + normalize(processingData.apiName)}${configs().getDelimiter()}endpoints${configs().getDelimiter()}`;
            pathYpSetting = `${decodeURIComponent(JSON.parse(data).path)}.ypsettings.json`;
            businesslogicFile = `${pathEndPoint + normalize(processingData.endPointName)}.js`;
            ui.log.write(chalk.green('✓ Execution starts....'));
            callback(null);
          }
        });
      } else {
        callback(customMessage(customErrorConfig().customError.VALIDATION_ENDPOINT_REQUIRED));
      }
    },
    function (callback) {
      fs.stat(businesslogicFile, (err, stats) => {
        if (err) {
          callback(customMessage(customErrorConfig().customError.APIEPERR));
        } else {
          const mtime = new Date(util.inspect(stats.mtime));
          updateBusinessLogicData.lastModifiedDateTime = mtime;
          callback(null);
        }
      });
    },
    function (callback) {
      fs.readFile(businesslogicFile, 'utf8', (err, data) => {
        if (err) {
          if (err.errno == -2) {
            callback(customMessage(customErrorConfig().customError.ENOENT));
          } else if (err.code == 1) {
            callback(customMessage(customErrorConfig().customError.EACCES));
          } else {
            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
          }
        } else {
          setTimeout(() => {
            ui.log.write(chalk.green('✓ Checking the apiname and endpointname...'));
            updateBusinessLogicData.businessLogic = data;
            callback(null, updateBusinessLogicData);
          }, 1000);
        }
      });
    },
    function (updateBusinessLogicData, callback) {
      let errorCondition = false;
      fs.readFile(pathYpSetting, 'utf8', (err, data) => {
        if (err) {
          callback(err);
        } else {
          ypSettings = JSON.parse(data);
          let apiNameIndex = 0;
          for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
            let endpointIndex = 0;
            if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
              for (endpointIndex = 0; ypSettings.apiReferences[apiNameIndex].endPointReferences.length > endpointIndex; endpointIndex++) {
                if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                  updateBusinessLogicData.endpointReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                }
                errorCondition = false;
              }
              break;
            } else {
              errorCondition = true;
            }
          }
          if (errorCondition) {
            callback(customMessage(customErrorConfig().customError.INVALID_ENDPOINTNAME.errorMessage));
          } else {
            setTimeout(() => {
              ui.log.write(chalk.green('✓ Getting the latest code from local...'));
              callback(null, updateBusinessLogicData);
            }, 1000);
          }
        }
      });
    },
    function (updateBusinessLogicData, callback) {
      const endPointPath = `/cli/resource/businesslogic/${processingData.apiName}`;
      ypRequest.call(endPointPath, 'put', updateBusinessLogicData, (err, statusResponse) => {
        if (err) {
          callback(err);
        } else if (statusResponse.code == 200) {
          setTimeout(() => {
            ui.log.write(chalk.green('✓ Deploying the code base to remote...'));
            callback(null, statusResponse);
          }, 1000);
        } else {
          callback(statusResponse.data.message);
        }
      });
    },
  ],
  (error, result) => {
    if (error) {
      clearInterval(tickInterval);
      ui.close();
      callback(error);
    } else {
      setTimeout(() => {
        clearInterval(tickInterval);
        ui.updateBottomBar('');
        callback(null, customMessagesConfig().customMessages.DEPLOY_SUCCESS.message);
        ui.updateBottomBar(chalk.green('✓ Deploy command execution completed'));
        ui.close();
      }, 1000);
    }
  });
};
