const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const util = require('util');
const async = require('async');
const netrc = require('../utils/netrc');
const { configs } = require('../configs/yp_configs');
const ypRequest = require('../utils/yp_request');
const { normalize, customMessage, invalidName } = require('../utils/yp_normalize');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');

function writeFile(path, remoteData, remoteModTime, callback) {
  fs.writeFile(path, decodeURI(remoteData), (err) => {
    if (err) {
      callback(err);
    } else {
      fs.utimesSync(path, remoteModTime, remoteModTime);
      callback(null);
    }
  });
}

module.exports = function (processingData, callback) {
  const cliPullData = {
    apiName: '',
    endpointDetails: [],
  };
  let endPointsBulkArray = [];
  let pathEndPoint = '';
  let pathYpSetting = '';
  let ypSettings = '';
  let endPointFile = '';
  let responseDataPull = '';
  let workspacePath = '';
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
      if (processingData.endPointName == undefined) {
        configs().getConfigSettings((err, data) => {
          if (err) {
            callback(err);
          } else {
            workspacePath = decodeURIComponent(JSON.parse(data).path);
            pathEndPoint = `${workspacePath + normalize(processingData.apiName)}${configs().getDelimiter()}endpoints${configs().getDelimiter()}`;
            pathYpSetting = `${workspacePath}.ypsettings.json`;
            ui.log.write(chalk.green('✓ Execution starts....'));
            callback(null);
          }
        });
      } else {
        configs().getConfigSettings((err, data) => {
          if (err) {
            callback(err);
          } else {
            workspacePath = decodeURIComponent(JSON.parse(data).path);
            pathEndPoint = `${workspacePath + normalize(processingData.apiName)}${configs().getDelimiter()}endpoints${configs().getDelimiter()}`;
            pathYpSetting = `${workspacePath}.ypsettings.json`;
            endPointFile = `${pathEndPoint + normalize(processingData.endPointName)}.js`;
            ui.log.write(chalk.green('✓ Execution starts....'));
            callback(null);
          }
        });
      }
    },
    function (callback) {
      if (processingData.endPointName == undefined) {
        fs.readdir(pathEndPoint, (err, files) => {
          if (err) {
            invalidName(workspacePath, (error) => {
              callback(error);
            });
          } else {
            endPointsBulkArray = files;
            setTimeout(() => {
              ui.log.write(chalk.green('✓ Collecting api and its endpoint details.'));
              callback(null);
            }, 1000);
          }
        });
      } else {
        fs.stat(endPointFile, (err, stats) => {
          if (err) {
            callback(customMessage(customErrorConfig().customError.APIEPERR.errorMessage));
          } else {
            const mtime = new Date(util.inspect(stats.mtime));
            cliPullData.apiName = processingData.apiName;
            cliPullData.endpointDetails.push({ endpointName: processingData.endPointName, lastModifiedDateTime: mtime });
            setTimeout(() => {
              callback(null);
              ui.log.write(chalk.green('✓ Collecting api and its endpoint details.'));
            }, 1000);
          }
        });
      }
    },
    function (callback) {
      let errorCondition = false;
      fs.readFile(pathYpSetting, 'utf8', (err, data) => {
        if (err) {
          callback(err);
        } else {
          let fileNumber = 0;
          ypSettings = JSON.parse(data);
          if (processingData.endPointName == undefined) {
            cliPullData.apiName = processingData.apiName;
            async.whilst(() => fileNumber < endPointsBulkArray.length,
              (callback) => {
                fs.stat(pathEndPoint + endPointsBulkArray[fileNumber], (err, stats) => {
                  if (err) {
                    callback(err);
                  } else {
                    const mtime = new Date(util.inspect(stats.mtime));
                    const hashArr = [];
                    for (let apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                      if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                        for (let epIndex = 0; epIndex < ypSettings.apiReferences[apiNameIndex].endPointReferences.length; epIndex++) {
                          hashArr.push(ypSettings.apiReferences[apiNameIndex].endPointReferences[epIndex].hash);
                        }
                      }
                    }
                    endPointsBulkArray[fileNumber] = normalize(endPointsBulkArray[fileNumber]);
                    const resourceDetails = { endpointName: endPointsBulkArray[fileNumber], lastModifiedDateTime: mtime, hashReference: hashArr[fileNumber] };
                    cliPullData.endpointDetails.push(resourceDetails);
                    fileNumber++;
                    callback(null);
                  }
                });
              },
              (err) => {
                if (err) {
                  callback(err);
                } else {
                  callback(null, cliPullData);
                }
              });
          } else {
            let apiNameIndex = 0;
            for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
              let endpointIndex = 0;
              if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                for (endpointIndex = 0; ypSettings.apiReferences[apiNameIndex].endPointReferences.length > endpointIndex; endpointIndex++) {
                  if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                    cliPullData.endpointDetails[0].hashReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
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
              callback(null, cliPullData);
            }
          }
        }
      });
    },
    function (cliPullData, callback) {
      const endPointPath = '/cli/endpoint/pull/';
      ypRequest.call(endPointPath, 'post', cliPullData, (err, statusResponse) => {
        if (err) {
          callback(err);
        } else {
          setTimeout(() => {
            ui.log.write(chalk.green('✓ Making pull request to remote.'));
          }, 1000);
          if (processingData.endPointName == undefined) {
            if (statusResponse.code == 200) {
              responseDataPull = statusResponse;
              callback(null);
            }
          } else if (statusResponse.code == 200) {
            responseDataPull = statusResponse;
            callback(null);
          } else if (statusResponse.code == 400) {
            if (statusResponse.status == 'local-latest') {
              callback(statusResponse.data.message);
            } else if (statusResponse.status == 'local-remote-already-sync') {
              callback(statusResponse.data.message);
            } else {
              callback(statusResponse.message);
            }
          } else {
            callback(statusResponse.data.message);
          }
        }
      });
    },
    function (callback) {
      let epIndex = 0;
      let syncResponse = '';
      let path = '';
      if (responseDataPull.data.endpointPullList.length >= 1) {
        async.whilst(() => epIndex < responseDataPull.data.endpointPullList.length, (callback) => {
          if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'yes') {
            syncResponse += `'${responseDataPull.data.endpointPullList[epIndex].endpointName}'${customMessagesConfig().customMessages.PULL_BEHIND.message}`;
            path = `${pathEndPoint + normalize(responseDataPull.data.endpointPullList[epIndex].endpointName)}.js`;
            writeFile(path, decodeURI(responseDataPull.data.endpointPullList[epIndex].businesslogic),
              new Date(responseDataPull.data.endpointPullList[epIndex].remoteModifiedDateTime),
              (err) => {
                if (err) {
                  callback(err);
                } else {
                  epIndex++;
                  callback(null);
                }
              });
          } else if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'no') {
            syncResponse += `'${responseDataPull.data.endpointPullList[epIndex].endpointName}'${customMessagesConfig().customMessages.PULL_FORWARD.message}`;
            epIndex++;
            callback(null);
          } else if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'in-sync') {
            syncResponse += `'${responseDataPull.data.endpointPullList[epIndex].endpointName}'${customMessagesConfig().customMessages.PULL_INSYNC.message}`;
            epIndex++;
            callback(null);
          }
        }, (err) => {
          if (err) {
            callback(err);
          } else {
            callback(null, syncResponse);
          }
        });
      }
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
        callback(null, result);
        ui.updateBottomBar(chalk.green('✓ Pull command execution completed'));
        ui.close();
      }, 1000);
    }
  });
};
