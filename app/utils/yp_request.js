const request = require('request');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
const { customErrorConfig } = require('../configs/yp_custom_error');

exports.call = function (endPointPath, operation, data, callback) {
  const self = this;
  let reqOptions = {};
  const netrcObj = netrc();
  const hostObj = configs().getHostDetails();
  let formattedError = '';
  let endPointUri = `${hostObj.scheme}://${hostObj.host}:${hostObj.port}${hostObj.basePath}`;
  endPointUri += endPointPath;

  reqOptions = {
    url: endPointUri,
    json: true,
    body: data,
    headers: {},
  };

  if (netrcObj.hasOwnProperty(hostObj.host)) {
    reqOptions.headers['X-YPCLI-TOKEN'] = netrcObj[hostObj.host].password;
  } else {
    return callback(customErrorConfig().customError.VALIDATION_ERROR_LOGIN);
  }

  if (operation == 'post') {
    request.post(reqOptions, (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.hasOwnProperty('error')) {
        if (body.error.name == 'invalid-credentials') {
          callback('Invalid Credentials. Please enter the correct ones');
        } else {
          formattedError = `ERROR: ${body.error.code}-${body.error.message}`;
          callback(formattedError);
        }
      } else {
        callback(null, body);
      }
    });
  } else if (operation == 'put') {
    request.put(reqOptions, (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.hasOwnProperty('error')) {
        if (body.error.name == 'invalid-credentials') {
          callback('Invalid Credentials. Please enter the correct ones');
        } else {
          formattedError = `ERROR: ${body.error.code}-${body.error.message}`;
          callback(formattedError);
        }
      } else {
        callback(null, body);
      }
    });
  } else if (operation == 'get') {
    request.get(reqOptions, (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.hasOwnProperty('error')) {
        if (body.error.name == 'invalid-credentials') {
          callback('Invalid Credentials. Please enter the correct ones');
        } else {
          formattedError = `ERROR: ${body.error.code}-${body.error.message}`;
          callback(formattedError);
        }
      } else {
        callback(null, body);
      }
    });
  } else if (operation == 'delete') {
    request.delete(reqOptions, (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.hasOwnProperty('error')) {
        if (body.error.name == 'invalid-credentials') {
          callback('Invalid Credentials. Please enter the correct ones');
        } else {
          formattedError = `ERROR: ${body.error.code}-${body.error.message}`;
          callback(formattedError);
        }
      } else {
        callback(null, body);
      }
    });
  }
};


exports.cliLogin = function (endPointPath, operation, data, callback) {
  const self = this;
  let reqOptions = {};
  const hostObj = configs().getHostDetails();
  let formattedError = '';
  let endPointUri = `${hostObj.scheme}://${hostObj.host}:${hostObj.port}${hostObj.basePath}`;
  endPointUri += endPointPath;

  if (operation == 'post') {
    reqOptions = {
      url: endPointUri,
      json: true,
      body: data,
    };
    request.post(reqOptions, (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.hasOwnProperty('error')) {
        if (body.error.name == 'invalid-credentials') {
          callback('Invalid Credentials. Please enter the correct ones');
        } else {
          formattedError = `ERROR: ${body.error.code}-${body.error.message}`;
          callback(formattedError);
        }
      } else {
        callback(null, body);
      }
    });
  } else {
    callback(new Error('Only POST operation supported for Login'));
  }
};
