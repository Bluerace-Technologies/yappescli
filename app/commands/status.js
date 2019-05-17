const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const util = require('util');
const async = require('async');

const netrc = require('../utils/netrc');
const { configs } = require('../configs/yp_configs');
const { resolveOSCommands } = require('../utils/yp_resolve_os');
const {
  normalize, denormalize, customMessage, invalidName,
} = require('../utils/yp_normalize');
const ypRequest = require('../utils/yp_request');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');


module.exports = function (processingData, callback) {
  const apiDetails = { apiName: processingData.apiName, endpointDetails: [] };
  let path = '';
  let workspacePath = '';
  let workspaceFileJson = {};
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
  const hostObj = configs().getHostDetails();
  let loginUser = '';
  if (netrcObj.hasOwnProperty(hostObj.host)) {
    loginUser = netrcObj[hostObj.host].login;
  } else {
    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
    clearInterval(tickInterval);
    ui.close();
    return callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
  }
  async.waterfall([
    function (callback) {
      configs().getConfigSettings((err, data) => {
        if (err) {
          callback(err);
        } else {
          workspacePath = decodeURIComponent(JSON.parse(data).path);
          path = `${workspacePath + normalize(processingData.apiName)}${configs().getDelimiter()}endpoints${configs().getDelimiter()}`;
          callback(null);
        }
      });
    },
    function (callback) {
      fs.readFile(`${workspacePath}${configs().getDelimiter()}.ypsettings.json`, 'utf8', (err, data) => {
        if (err) {
          const error_code = 3000;
          if (err.errno == -2) {
            callback(customMessage(customErrorConfig().customError.ENOENT));
          } else if (err.code == 1) {
            callback(customMessage(customErrorConfig().customError.EACCES));
          } else {
            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
          }
        } else {
          workspaceFileJson = JSON.parse(data);
          callback(null);
        }
      });
    },
    function (callback) {
      fs.readdir(path, (err, files) => {
        if (err) {
          callback(err);
        } else {
          callback(null, files);
        }
      });
    },
    function (listFile, callback) {
      let fileNumber = 0;
      async.whilst(() => fileNumber < listFile.length,
        (callback) => {
          fs.stat(path + listFile[fileNumber], (err, stats) => {
            if (err) {
              callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
            } else {
              const mtime = new Date(util.inspect(stats.mtime));
              const hashArr = [];
              for (let apiNameIndex = 0; apiNameIndex < workspaceFileJson.apiReferences.length; apiNameIndex++) {
                if (workspaceFileJson.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                  for (let epIndex = 0; epIndex < workspaceFileJson.apiReferences[apiNameIndex].endPointReferences.length; epIndex++) {
                    hashArr.push(workspaceFileJson.apiReferences[apiNameIndex].endPointReferences[epIndex].hash);
                  }
                }
              }
              const resourceDetails = { endpointName: listFile[fileNumber], lastModifiedDateTime: mtime, hashReference: hashArr[fileNumber] };
              apiDetails.endpointDetails.push(resourceDetails);
              fileNumber++;
              callback(null);
            }
          });
        },
        (err) => {
          if (err) {
            callback(err);
          } else {
            ui.log.write(chalk.green('✓ Fetching remote details....'));
            callback(null, apiDetails);
          }
        });
    },
    function (apiDetails, callback) {
      const endPointPath = '/cli/endpoint/status/';
      ypRequest.call(endPointPath, 'post', apiDetails, (err, statusResponse) => {
        if (err) {
          callback(err);
        } else if (statusResponse.code == 200) {
          setTimeout(() => {
            ui.log.write(chalk.green('✓ Checking for status ....'));
            callback(null, statusResponse);
          }, 1000);
        } else {
          callback(statusResponse.data.message);
        }
      });
    },
    function (statusResponse, callback) {
      let epIndex = 0;
      let syncResponse = '';
      if (statusResponse.data.length) {
        async.whilst(() => epIndex < statusResponse.data.length, (callback) => {
          if (statusResponse.data[epIndex].remoteSync == 'yes') {
            syncResponse += `'${statusResponse.data[epIndex].endpointName}'${customMessagesConfig().customMessages.RMCODEAHEAD.message}`;
            epIndex++;
          } else if (statusResponse.data[epIndex].remoteSync == 'no') {
            syncResponse += `'${statusResponse.data[epIndex].endpointName}'${customMessagesConfig().customMessages.LCCODEAHEAD.message}`;
            epIndex++;
          } else if (statusResponse.data[epIndex].remoteSync == 'in-sync') {
            syncResponse += `'${statusResponse.data[epIndex].endpointName}'${customMessagesConfig().customMessages.PULL_INSYNC.message}`;
            epIndex++;
          }
          callback(null);
        }, (err) => {
          if (err) {
            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
          } else {
            const status = {};
            status.syncResponse = syncResponse;
            status.statusResponse = statusResponse;
            callback(null, status);
          }
        });
      } else { callback(statusResponse); }
    },
  ], (err, res) => {
    if (err) {
      clearInterval(tickInterval);
      ui.close();
      if (err.errno == -2) {
        invalidName(workspacePath, (err) => {
          callback(err);
        });
      } else {
        callback(err);
      }
    } else {
      setTimeout(() => {
        clearInterval(tickInterval);
        ui.updateBottomBar('');
        ui.updateBottomBar(chalk.green('✓ status command execution completed \n'));
        ui.close();
        callback(null, res);
      }, 1000);
    }
  });
};
