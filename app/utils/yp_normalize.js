const fs = require('fs');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');

const self = this;
exports.normalize = function (inputData) {
  if (inputData.includes(' ')) {
    inputData = inputData.split(' ').join('_');
    return inputData;
  }
  return inputData;
};

exports.denormalize = function (inputData, setFile) {
  const regex = /_/gi;
  let denormString = '';
  let matchFound = false;
  const denormList = [];
  for (let lcount = 0; lcount < inputData.length; lcount++) {
    matchFound = false;
    denormString = inputData[lcount].replace(regex, ' ');
    for (let scount = 0; scount < setFile.apiReferences.length && !matchFound; scount++) {
      if (setFile.apiReferences[scount].apiName == denormString) {
        matchFound = true;
        denormList.push(denormString);
      }
    }
  }
  return denormList;
};

exports.customMessage = function (customMessageObj) {
  let message = '';
  if (customMessageObj.errorCode) {
    message = `Error Code: ${customMessageObj.errorCode}\n` + `Error Message: ${customMessageObj.errorMessage}`;
  } else if (customMessageObj.code) {
    message = `Success Code: ${customMessageObj.code}\n` + `Success Message: ${customMessageObj.message}`;
  } else {
    	message = JSON.stringify(customMessageObj);
  }
  return message;
};


exports.invalidName = function (workspacePath, callback) {
  fs.readdir(workspacePath, (err, files) => {
    if (err) {
      error_code = 3000;
      if (err.errno == -2) {
        callback(self.customMessage(customErrorConfig().customError.ENOENT));
      } else if (err.code == 1) {
        callback(self.customMessage(customErrorConfig().customError.EACCES));
      } else {
        callback(self.customMessage(customErrorConfig().customError.EOPNOTSUPP));
      }
    } else {
      const index = files.indexOf('.ypsettings.json');
      if (index > -1) {
        files.splice(index, 1);
      }
      callback(`${self.customMessage(customErrorConfig().customError.APNAMEERR)}\nAvailable apis are :${JSON.stringify(files)}`);
    }
  });
};
