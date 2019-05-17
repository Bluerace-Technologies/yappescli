const fs = require('fs');
const async = require('async');
const isWsl = require('is-wsl');
const nodeCmd = require('node-cmd');

const settingFileName = '.ypsettings.json';
const inquirer = require('inquirer');
const chalk = require('chalk');
const netrc = require('../utils/netrc');
const { normalize, customMessage } = require('../utils/yp_normalize');
const { resolveOSCommands } = require('../utils/yp_resolve_os');
const ypRequest = require('../utils/yp_request');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');
const { configs } = require('../configs/yp_configs');

function createSettingsFile(apiHashDetails, workspace, callback) {
  const path = workspace;
  const commandOptions = resolveOSCommands();
  const touchCmd = `${commandOptions['create-file']} ${path}${settingFileName}`;
  nodeCmd.get(touchCmd, (err, data) => {
    if (err) {
      callback(err);
    } else {
      const settingsData = {
        cloneReference: 'clr',
        apiReferences: [{
          apiName: apiHashDetails.apiDetails.apiName,
          hash: apiHashDetails.apiDetails.hash,
          yappesUrls: apiHashDetails.apiDetails.urls,
          remoteEndpoints: apiHashDetails.apiDetails.remoteEndpoints,
          endPointReferences: [],
        }],
      };
      for (let i = 0; i < apiHashDetails.endpointDetails.length; i++) {
        const endPointTempVar = {
          endpointName: apiHashDetails.endpointDetails[i].endPointName,
          hash: apiHashDetails.endpointDetails[i].hash,
          endPoint: apiHashDetails.endpointDetails[i].endPoint,
          method: apiHashDetails.endpointDetails[i].method,
        };
        settingsData.apiReferences[0].endPointReferences.push(endPointTempVar);
      }
      fs.writeFile(path + settingFileName, JSON.stringify(settingsData, null, 4), (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    }
  });
}

function appendSettingsFile(apiHashDetails, workspace, callback) {
  const path = workspace;
  async.waterfall([
    function (callback) {
      fs.readFile(path + settingFileName, 'utf8', (err, data) => {
        if (err) {
          callback(err);
        } else {
          const content = JSON.stringify(data);
          data = JSON.parse(JSON.parse(content));
          callback(null, data);
        }
      });
    },
    function (fileData, callback) {
      let epIndex = 0;
      let newApiClone = false;
      const settingsData = {
        apiReferences: {
          apiName: apiHashDetails.apiDetails.apiName,
          hash: apiHashDetails.apiDetails.hash,
          yappesUrls: apiHashDetails.apiDetails.urls,
          remoteEndpoints: apiHashDetails.apiDetails.remoteEndpoints,
          endPointReferences: [],
        },
      };
      let apiCount = 0;
      for (let i = 0; i < apiHashDetails.endpointDetails.length; i++) {
        const endPointTempVar = {
          endpointName: apiHashDetails.endpointDetails[i].endPointName,
          hash: apiHashDetails.endpointDetails[i].hash,
          endPoint: apiHashDetails.endpointDetails[i].endPoint,
          method: apiHashDetails.endpointDetails[i].method,
        };
        settingsData.apiReferences.endPointReferences.push(endPointTempVar);
      }
      async.whilst(() => epIndex < fileData.apiReferences.length, (callback) => {
        if (apiHashDetails.apiDetails.hash == fileData.apiReferences[epIndex].hash) {
          fileData.apiReferences[epIndex] = settingsData.apiReferences;
        } else {
          apiCount++;
        }
        if (apiCount == fileData.apiReferences.length) {
          newApiClone = true;
        }
        epIndex++;
        callback(null);
      }, (err) => {
        if (err) {
          callback(err);
        } else {
          if (newApiClone) {
            fileData.apiReferences.push(settingsData.apiReferences);
          }
          callback(null, fileData);
        }
      });
    },
    function (fileData, callback) {
      fs.writeFile(path + settingFileName, JSON.stringify(fileData, null, 4), (err) => {
        if (err) { callback(err); } else {
          callback(null);
        }
      });
    },
  ], (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

function fetchWorkspacePath(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      callback(err);
    } else {
      callback(null, data);
    }
  });
}

function createWsPath(path, callback) {
  const commandOptions = resolveOSCommands();
  const workspacePath = {
    path: encodeURIComponent(`${process.cwd()}${configs().getDelimiter()}ypworkspace${configs().getDelimiter()}`),
  };
  const configPath = `${process.env.HOME || process.env.USERPROFILE}${configs().getDelimiter()}${configs().configBase}`;
  const cmd = `${commandOptions['create-dir']} ${configPath}`;
  nodeCmd.get(cmd, (err, data) => {
    if (err) {
      callback(err);
    } else {
      fs.writeFile(path, JSON.stringify(workspacePath), (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null, workspacePath.path);
        }
      });
    }
  });
}

function createYpClasses(workspace, apiHashDetails, callback) {
  const path = workspace;
  const commandOptions = resolveOSCommands();
  const touchCmd = `${commandOptions['create-dir']} ${path}${configs().getDelimiter()}${normalize(apiHashDetails.apiDetails.apiName)}${configs().getDelimiter()}test`;
  nodeCmd.get(touchCmd, (err, data) => {
    if (err) {
      callback(err);
    } else {
      async.waterfall([function (callback) {
        fs.readFile(`${__dirname}${configs().getDelimiter()}..${configs().getDelimiter()}tests${configs().getDelimiter()}reqresdata.js`, 'UTF-8', (err, data) => {
          if (err) {
            callback(err);
          } else {
            callback(null, data);
          }
        });
      }, function (fileData, callback) {
        const reqResObject = fileData;
        fs.writeFile(`${path + normalize(apiHashDetails.apiDetails.apiName)}${configs().getDelimiter()}test${configs().getDelimiter()}` + 'executestub.js', reqResObject, (err) => {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      }], (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    }
  });
}

function createRuntimeConfig(apiHashDetails, path, callback) {
  const environmentDetails = {
    body: {},
    queryParameters: {},
    headers: {},
    pathParameters: {},
    yappesEnvironment: '',
    yappesKey: '',
  };
  fs.writeFile(path, JSON.stringify(environmentDetails, null, 4), (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}


module.exports = function (processingData, callback) {
  const commandOptions = resolveOSCommands();
  const netrcObj = netrc();
  let loginUser = '';
  let apiHashDetails = {};
  let configFileExists = false;
  let workspace = '';
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
  const hostObj = configs().getHostDetails();
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
          if (err.errno == -2) {
            const path = `${process.env.HOME || process.env.USERPROFILE}${configs().getDelimiter()}${configs().configBase}${configs().getDelimiter()}settings.json`;
            createWsPath(path, (err, workspacePath) => {
              if (err) {
                callback(err);
              } else {
                workspace = decodeURIComponent(workspacePath);
                callback(null);
              }
            });
          } else {
            callback(err);
          }
        } else {
          workspace = decodeURIComponent(JSON.parse(data).path);
          if (!workspace || workspace.length == 0) {
            const path = `${process.env.HOME || process.env.USERPROFILE}${configs().getDelimiter()}${configs().configBase}${configs().getDelimiter()}settings.json`;
            const workspacePath = {
              path: encodeURIComponent(`${process.cwd()}${configs().getDelimiter()}ypworkspace${configs().getDelimiter()}`),
            };
            fs.writeFile(path, JSON.stringify(workspacePath), (err) => {
              if (err) {
                callback(err);
              } else {
                workspace = decodeURIComponent(workspacePath.path);
                callback(null);
              }
            });
          } else {
            callback(null);
          }
        }
      });
    },
    function (callback) {
      if (fs.existsSync(workspace + settingFileName)) {
        configFileExists = true;
        callback(null);
      } else {
        callback(null);
      }
    },
    function (callback) {
      delete processingData.endPointPath;
      const endPointPath = `${configs().getDelimiter()}cli${configs().getDelimiter()}clone${configs().getDelimiter()}apidefinitions/${loginUser}`;
      ypRequest.call(endPointPath, 'post', processingData, (err, apiResponse) => {
        if (err) {
          callback(err);
        } else if (apiResponse.code == 200) {
          ui.log.write(chalk.green('✓ Fetching remote details....'));
          apiHashDetails = apiResponse.data;
          callback(null, apiResponse);
        } else if (apiResponse.message) {
          callback(apiResponse.message);
        } else {
          callback(apiResponse.data.message);
        }
      });
    },
    function (apiResponse, callback) {
      if (process.platform == 'win32' || isWsl) {
        if (fs.existsSync(`${workspace + normalize(apiResponse.data.apiDetails.apiName)}`)) {
          let delCmd = `${commandOptions['delete-dir']} /Q /S `;
          const path = `${workspace + normalize(apiResponse.data.apiDetails.apiName)}${configs().getDelimiter()}`;
          delCmd += path;
          nodeCmd.get(delCmd, (err, data) => {
            if (err) {
              callback(err);
            } else {
              callback(null, apiResponse);
            }
          });
        } else {
          callback(null, apiResponse);
        }
      } else {
        callback(null, apiResponse);
      }
    },
    function (apiResponse, callback) {
      let index = 0;
      let cmd = `${commandOptions['create-dir']} `;
      const path = `${workspace + normalize(apiResponse.data.apiDetails.apiName)}${configs().getDelimiter()}endpoints`;
      cmd += path;
      nodeCmd.get(cmd, (err, data) => {
        if (err) {
          callback(err);
        } else {
          async.whilst(() => index < apiResponse.data.endpointDetails.length,
            (callback) => {
              const touchCmd = `${commandOptions['create-file']} ${path}${configs().getDelimiter()}${normalize(apiResponse.data.endpointDetails[index].endPointName)}.js`;
              nodeCmd.get(touchCmd, (err, data) => {
                if (err) {
                  callback(err);
                } else {
                  fs.writeFile(`${path}/${normalize(apiResponse.data.endpointDetails[index].endPointName)}.js`, apiResponse.data.endpointDetails[index].businessLogic, (err) => {
                    if (err) {
                      callback(err);
                    } else {
                      fs.utimesSync(`${path}/${normalize(apiResponse.data.endpointDetails[index].endPointName)}.js`,
                        new Date(apiResponse.data.endpointDetails[index].modifiedDateTime),
                        new Date(apiResponse.data.endpointDetails[index].modifiedDateTime));
                      index++;
                      callback(null);
                    }
                  });
                }
              });
            },
            (err) => {
              if (err) {
                callback(err);
              } else {
                setTimeout(() => {
                  ui.log.write(chalk.green('✓ Summoning Files ....'));
                  callback(null, `${customMessagesConfig().customMessages.CLSUCCESS.message} ${processingData.apiIdentifier}`);
                }, 1000);
              }
            });
        }
      });
    },
    function (res, callback) {
      if (!configFileExists) {
        createSettingsFile(apiHashDetails, workspace, (err) => {
          if (err) {
            callback(err);
          } else {
            setTimeout(() => {
              ui.log.write(chalk.green('✓ Creating Settings file  ....'));
              callback(null, res);
            }, 1000);
          }
        });
      } else {
        appendSettingsFile(apiHashDetails, workspace, (err) => {
          if (err) {
            callback(err);
          } else {
            setTimeout(() => {
              ui.log.write(chalk.green('✓ Updating Settings Files ....'));
              callback(null, res);
            }, 1000);
          }
        });
      }
    },
    function (result, callback) {
      createYpClasses(workspace, apiHashDetails, (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result);
        }
      });
    },
    function (result, callback) {
      const configFilePath = `${workspace}${configs().getDelimiter()}${normalize(apiHashDetails.apiDetails.apiName)}${configs().getDelimiter()}test${configs().getDelimiter()}runtime_config.json`;
      createRuntimeConfig(apiHashDetails, configFilePath, (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result);
        }
      });
    },
  ], (err, res) => {
    if (err) {
      clearInterval(tickInterval);
      ui.close();
      if (err.errno == -2) {
        callback(customMessage(customErrorConfig().customError.ELIBBAD));
      } else if (err.code == 1) {
        callback(customMessage(customErrorConfig().customError.EACCES));
      } else {
        const serverError = customErrorConfig().customError.APNAMEERR;
        serverError.errorMessage = err;
        callback(customMessage(serverError));
      }
    } else {
      setTimeout(() => {
        clearInterval(tickInterval);
        ui.updateBottomBar('');
        ui.updateBottomBar(chalk.green('✓ Clone command execution completed \n'));
        ui.updateBottomBar(chalk.green('"ypworkspace" folder is created in the current directory for you'
                    + ' to work on the business logic.\n For details refer https://docs.yappes.com/cli_tool_clone \n'));
        ui.close();
        callback(null, res);
      }, 1000);
    }
  });
};
