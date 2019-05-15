const fs = require('fs');
const async = require('async');
const nodeCmd = require('node-cmd');
const http = require('http');
const https = require('https');
const url = require('url');
const qs = require('qs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const netrc = require('../utils/netrc');
const {
  normalize, customMessage, invalidName,
} = require('../utils/yp_normalize');
const { resolveOSCommands } = require('../utils/yp_resolve_os');
const { customErrorConfig } = require('../configs/yp_custom_error');
const { configs } = require('../configs/yp_configs');
const status = require('./status');


function runLogic(apiUrl, parameters, yappesKey, callback) {
  let reqSchemeObj = https;
  let responseChunk = '';
  const methodList = ['get', 'post', 'put', 'delete', 'patch'];
  if (parameters.method) {
    if (parameters.method === parameters.method.toUpperCase()) {
      parameters.method = parameters.method.toLowerCase();
    } else {
      parameters.method = parameters.method.toLowerCase();
    }
    if (methodList.indexOf(parameters.method) == -1) {
      callback(customMessage(customErrorConfig().customError.METHODNTALLOWEDERR));
    }
  } else {
    callback(customMessage(customErrorConfig().customError.METHODNAERR));
  }


  const urlParts = url.parse(apiUrl);
  const options = {
    host: urlParts.hostname,
    path: urlParts.pathname,
    port: urlParts.port ? urlParts.port : 98,
    method: parameters.method,
    headers: parameters.headers,
  };
  if (options.method != 'get') {
    if (Object.keys(parameters.payload).length <= 0) {
      return callback(customMessage(customErrorConfig().customError.PAYLOADERR));
    }
  }
  options.headers['X-YAPPES-KEY'] = yappesKey;
  if (!options.port) {
    options.port = 443;
  }
  if (Object.keys(parameters.queryparams).length > 0) {
    options.path += `?${qs.stringify(parameters.queryparams, {
      encode: false,
    })}`;
  }

  if (!urlParts.protocol.match(/https+/)) {
    reqSchemeObj = http;
  } else {
    reqSchemeObj = https;
  }
  const requestObj = reqSchemeObj.request(options, (response) => {
    response.on('data', (chunk) => {
      responseChunk += chunk;
    });
    response.on('end', () => {
      callback(null, responseChunk);
    });
  });
  requestObj.write(JSON.stringify(parameters.payload));
  requestObj.on('error', (err) => {
    callback(err);
  });

  requestObj.end();
}

module.exports = function (processingData, callback) {
  const executeLogic = {
    endpointReference: '',
    businessLogic: '',
  };
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
  let workspacePath = '';
  let pathEndPoint = '';
  let apiNamePath = '';
  let pathYpSetting = '';
  let ypSettings = '';
  let businesslogicFile = '';
  let loginUser = '';
  const envRunList = ['remote', 'local'];
  const hostObj = configs().getHostDetails();
  if (netrcObj.hasOwnProperty(hostObj.host)) {
    loginUser = netrcObj[hostObj.host].login;
  } else {
    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
    clearInterval(tickInterval);
    ui.close();
    return callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
  }
  if (!processingData.run) {
    processingData.run = 'local';
  }
  if (envRunList.indexOf(processingData.run) < 0) {
    return callback(customMessage(customErrorConfig().customError.RNERR));
  }
  console.log(processingData);
  if (processingData.run.toLowerCase() == 'local') {
    async.waterfall([
      function (callback) {
        configs().getConfigSettings((err, data) => {
          if (err) {
            callback(err);
          } else {
            workspacePath =  decodeURIComponent(JSON.parse(data).path);
            apiNamePath = workspacePath + normalize(processingData.apiName);
            pathEndPoint = `${workspacePath + normalize(processingData.apiName)}${configs().getDelimiter()}endpoints${configs().getDelimiter()}`;
            pathYpSetting = `${workspacePath}.ypsettings.json`;
            businesslogicFile = `${pathEndPoint + normalize(processingData.endPointName)}.js`;
            callback(null);
          }
        });
      },
      function (callback) {
        fs.readFile(businesslogicFile, 'utf8', (err, data) => {
          if (err) {
            callback(customMessage(customErrorConfig().customError.APIEPERR));
          } else {
            executeLogic.businessLogic = data;
            ui.log.write(chalk.green('✓ Fetching the code ...'));
            callback(null, executeLogic);
          }
        });
      },
      function (executeLogic, callback) {
        let errorCondition = false;
        fs.readFile(pathYpSetting, 'utf8', (err, data) => {
          if (err) {
            callback(customMessage(customErrorConfig().customError.ENOENT));
          } else {
            ypSettings = JSON.parse(data);
            let apiNameIndex = 0;
            for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
              const endpointIndex = 0;
              if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                  if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                    executeLogic.endpointReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                  }
                  errorCondition = false;
                }
                break;
              } else {
                errorCondition = true;
              }
            }
            if (errorCondition) {
              invalidName(workspacePath, (err) => {
                callback(err);
              });
            } else {
              callback(null, executeLogic);
            }
          }
        });
      },
      function (executeLogic, callback) {
        let logic = '';
        let apiHash = '';
        async.waterfall([
          function (callback) {
            const cmd = 'npm root -g';
            let context = [];
            ypSettings.apiReferences.forEach((apiRef) => {
              if (processingData.apiName == apiRef.apiName) {
                context = apiRef.remoteEndpoints;
                apiHash = apiRef.hash;
              }
            });
            process.env.ypcontext = JSON.stringify({ ypsettings: context, apiHash });
            nodeCmd.get(cmd, (err, nodeModulePath) => {
              if (err) {
                callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
              } else {
                callback(null, nodeModulePath.trim());
              }
            });
          },
          function (nodeModulePath, callback) {
            let remoteSetArray = JSON.parse(process.env.ypcontext);
            remoteSetArray = remoteSetArray.ypsettings;
            fs.readFile(`${__dirname}/../template/logic_template.js`, 'UTF-8', (err, logicTemplateScript) => {
              if (err) {
                callback(err);
              } else {
                logic = logicTemplateScript.replace('logicTemplate', executeLogic.businessLogic);
                logic = logic.replace('globalTemplate', nodeModulePath);
                const rpMysqlTemplates = [{ dml: 'execute', syntax: ' remoteObject.remoteResponse = await remoteObject.execute' },
                  { dml: 'select', syntax: ' remoteObject.remoteResponse = await remoteObject.select' },
                ];
                const rpMongoTemplates = [{ dml: 'insert', syntax: ' remoteObject.remoteResponse = await remoteObject.insert' },
                  { dml: 'update', syntax: ' remoteObject.remoteResponse = await remoteObject.update' },
                  { dml: 'find', syntax: ' remoteObject.remoteResponse = await remoteObject.find' },
                ];
                const rpStoreTemplates = [{ dml: 'insert', syntax: ' remoteObject.remoteResponse = await remoteObject.insert' },
                  { dml: 'update', syntax: ' remoteObject.remoteResponse = await remoteObject.update' },
                  { dml: 'query', syntax: ' remoteObject.remoteResponse = await remoteObject.query' },
                ];
                const rpWebserviceTemplates = [{ dml: 'wsget', syntax: ' remoteObject.remoteResponse = await remoteObject.wsget' },
                  { dml: 'wspost', syntax: ' remoteObject.remoteResponse = await remoteObject.wspost' },
                  { dml: 'wsput', syntax: ' remoteObject.remoteResponse = await remoteObject.wsput' },
                  { dml: 'wsdelete', syntax: ' remoteObject.remoteResponse = await remoteObject.wsdelete' },
                ];
                let replaceSyntax = '';
                for (let rmcount = 0; rmcount < remoteSetArray.length; rmcount++) {
                  if (remoteSetArray[rmcount].configValues.type == 'mysql') {
                    for (let syncount = 0; syncount < rpMysqlTemplates.length; syncount++) {
                      replaceSyntax = rpMysqlTemplates[syncount].syntax;
                      replaceSyntax = replaceSyntax.replace(new RegExp('remoteObject', 'g'), remoteSetArray[rmcount].configValues.logicCodeName);
                      logic = logic.replace(new RegExp(`${remoteSetArray[rmcount].configValues.logicCodeName}.${rpMysqlTemplates[syncount].dml}`, 'g'), replaceSyntax);
                    }
                  } else if (remoteSetArray[rmcount].configValues.type == 'mongo') {
                    for (let syncount = 0; syncount < rpMongoTemplates.length; syncount++) {
                      replaceSyntax = rpMongoTemplates[syncount].syntax;
                      replaceSyntax = replaceSyntax.replace(new RegExp('remoteObject', 'g'), remoteSetArray[rmcount].configValues.logicCodeName);
                      logic = logic.replace(new RegExp(`${remoteSetArray[rmcount].configValues.logicCodeName}.${rpMongoTemplates[syncount].dml}`, 'g'), replaceSyntax);
                    }
                  } else if (remoteSetArray[rmcount].configValues.type == 'store') {
                    for (let syncount = 0; syncount < rpStoreTemplates.length; syncount++) {
                      replaceSyntax = rpStoreTemplates[syncount].syntax;
                      replaceSyntax = replaceSyntax.replace(new RegExp('remoteObject', 'g'), remoteSetArray[rmcount].configValues.logicCodeName);
                      logic = logic.replace(new RegExp(`${remoteSetArray[rmcount].configValues.logicCodeName}.${rpStoreTemplates[syncount].dml}`, 'g'), replaceSyntax);
                    }
                  } else if (remoteSetArray[rmcount].configValues.type == 'webservice') {
                    for (let syncount = 0; syncount < rpWebserviceTemplates.length; syncount++) {
                      replaceSyntax = rpWebserviceTemplates[syncount].syntax;
                      replaceSyntax = replaceSyntax.replace(new RegExp('remoteObject', 'g'), remoteSetArray[rmcount].configValues.logicCodeName);
                      logic = logic.replace(new RegExp(`${remoteSetArray[rmcount].configValues.logicCodeName}.${rpWebserviceTemplates[syncount].dml}`, 'g'), replaceSyntax);
                    }
                  }
                }
                callback(null, logic);
              }
            });
          },
          function (logic, callback) {
            const tempFile = `${apiNamePath}/temp.js`;
            fs.writeFile(tempFile, logic, (err) => {
              if (err) {
                callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
              } else {
                callback(null, tempFile);
              }
            });
          },
          function (file, callback) {
            const cmd = `node ${file}`;
            nodeCmd.get(cmd, (err, data) => {
              if (err) {
                callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
              } else {
                setTimeout(() => {
                  ui.log.write(chalk.green('✓ Running the Local Code'));
                  callback(null, file, data);
                }, 1000);
              }
            });
          },
          function (file, response, callback) {
            delete process.env.ypcontext;
            fs.unlink(file, (err) => {
              if (err) {
                callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
              } else {
                callback(null, response);
              }
            });
          },
        ], (err, result) => {
          if (err) {
            callback(err);
          } else {
            callback(null, result);
          }
        });
      },
    ],
    (error, result) => {
      if (error) {
        callback(error);
      } else {
        setTimeout(() => {
          clearInterval(tickInterval);
          ui.updateBottomBar('');
          ui.updateBottomBar(chalk.green('✓ Execute command completed\n'));
          ui.close();
          callback(null, result);
        }, 1000);
      }
    });
  } else if (processingData.run.toLowerCase() == 'remote') {
    async.waterfall([
      function (callback) {
        console.log("remote");
        fs.readFile(processingData.configFile, 'utf8', (err, data) => {
          if (err) {
            if (err.errno == -2) {
              callback(customMessage(customErrorConfig().customError.ENOENT));
            } else if (err.code == 1) {
              callback(customMessage(customErrorConfig().customError.EACCES));
            } else {
              callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
            }
          } else {
            const yappesConfig = JSON.parse(data);
            const environmentList = ['development', 'testing', 'production'];
            if (!yappesConfig.yappesEnvironment) {
              yappesConfig.yappesEnvironment = 'development';
            }
            if (environmentList.indexOf(yappesConfig.yappesEnvironment) > -1) {
              processingData.yappesEnvironment = yappesConfig.yappesEnvironment;
              processingData.yappesKey = yappesConfig.yappesKey;
              processingData.body = yappesConfig.body;
              processingData.queryparams = yappesConfig.queryParameters;
              processingData.headers = yappesConfig.headers;
              processingData.pathParameters = yappesConfig.pathParameters;
              callback(null);
            } else {
              callback(customMessage(customErrorConfig().customError.ENVERR));
            }
          }
        });
      },
      function (callback) {
        status(processingData, (err, response) => {
          if (err) {
            callback(err);
          } else {
            callback(null, response.statusResponse);
          }
        });
      },
      function (status, callback) {
        let localAhead = false; // local is ahead;
        let epExist = false; // wrong name passed
        console.log(status);
        status.data.forEach((epStatus) => {
          if (processingData.endPointName == epStatus.endpointName) {
            epExist = true;
            if (epStatus.remoteSync == 'yes') {
              localAhead = false;
            } else if (epStatus.remoteSync == 'no') {
              localAhead = true;
            } else {
              localAhead = false;
            }
          }
        });
        if (epExist) {
          if (localAhead) {
            callback(customMessage(customErrorConfig().customError.CDAHEAD));
          } else {
            callback(null);
          }
        } else {
          callback(customMessage(customErrorConfig().customError.EPNAMEERR));
        }
      },
      function (callback) {
        configs().getConfigSettings((err, data) => {
          if (err) {
            callback(err);
          } else {
            const pathYpSetting = `${decodeURIComponent(JSON.parse(data).path)}.ypsettings.json`;
            callback(null, pathYpSetting);
          }
        });
      },
      function (pathYpSetting, callback) {
        fs.readFile(pathYpSetting, 'utf8', (err, data) => {
            console.log(data);
          if (err) {
            if (err.errno == -2) {
              callback(customMessage(customErrorConfig().customError.ENOENT));
            } else if (err.code == 1) {
              callback(customMessage(customErrorConfig().customError.EACCES));
            } else {
              callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
            }
          } else {
            const ypSettings = JSON.parse(data);
            console.log("415");
            console.log(ypsettings);
            const yappesEndpointConfig = {
              url: '',
              endPoint: '',
              method: '',
            };
            ypSettings.apiReferences.forEach((apiRef) => {
                console.log(apiRef);
              if (processingData.apiName == apiRef.apiName) {
                yappesEndpointConfig.url = apiRef.yappesUrls;
                apiRef.endPointReferences.forEach((endpoints) => {
                  if (processingData.endPointName.toLowerCase() == endpoints.endpointName.toLowerCase()) {
                    yappesEndpointConfig.endPoint = endpoints.endPoint;
                    yappesEndpointConfig.method = endpoints.method;
                  }
                });
              }
            });
                      console.log(yappesEndpointConfig);
          console.log("431");
            callback(null, yappesEndpointConfig);
          }
        });
      },
      function (yappesEndpointConfig, callback) {
                  console.log(yappesEndpointConfig);
          console.log("436");
        if (yappesEndpointConfig.endPoint.includes('{') || yappesEndpointConfig.endPoint.includes('}')) {
          const endpointArr = yappesEndpointConfig.endPoint.split('/');
          const pathParamsList = Object.keys(processingData.pathParameters);
          const pathValuesList = Object.values(processingData.pathParameters);
          let keyCount = 0;
          const tempArr = [];
          endpointArr.forEach((el) => {
            if (el.includes('{')) {
              el = el.replace(/[{}]/g, '');
              tempArr.push(el);
            }
          });
          pathParamsList.forEach(
            (endpointElements) => {
              if (endpointArr.indexOf(`{${endpointElements}}`) > -1) {
                yappesEndpointConfig.endPoint = yappesEndpointConfig.endPoint.replace(`{${endpointElements}}`, pathValuesList[keyCount]);
                keyCount++;
              }
            },
          );
          if (keyCount == tempArr.length) {
            setTimeout(() => {
              ui.log.write(chalk.green('✓ passing the parameters'));
              callback(null, yappesEndpointConfig);
            }, 1000);
          } else {
            callback(customMessage(customErrorConfig().customError.PATHPRERR));
          }
        } else {
          setTimeout(() => {
            ui.log.write(chalk.green('✓ passing the parameters'));
            callback(null, yappesEndpointConfig);
          }, 1000);
        }
      },
      function (yappesEndpointConfig, callback) {
        const yappesBaseUrl = yappesEndpointConfig.url[processingData.yappesEnvironment];
        const yappesUrl = yappesBaseUrl + yappesEndpointConfig.endPoint;
        const parameters = {
          method: yappesEndpointConfig.method,
          headers: processingData.headers,
          queryparams: processingData.queryparams,
          payload: processingData.body,
        };
        runLogic(yappesUrl, parameters, processingData.yappesKey, (err, response) => {
          if (err) {
            callback(err);
          } else {
            setTimeout(() => {
              ui.log.write(chalk.green('✓ Remote Code Running'));
              callback(null, response);
            }, 1000);
          }
        });
      },
    ], (err, response) => {
      if (err) {
        clearInterval(tickInterval);
        ui.close();
        callback(err);
      } else {
        setTimeout(() => {
          clearInterval(tickInterval);
          ui.updateBottomBar('');
          ui.updateBottomBar(chalk.green('✓ Execute command completed\n'));
          ui.close();
          callback(null, response);
        }, 1000);
      }
    });
  }
};
