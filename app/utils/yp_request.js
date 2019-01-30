const request = require('request');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');

exports.call = function(endPointPath, operation, data, callback) {
    let self = this;
    let reqOptions = {};
    let netrcObj = netrc();
    let endPointUri = configs().hostDetails.scheme+"://"+configs().hostDetails.host+":"+configs().hostDetails.port+configs().hostDetails.basePath;
    endPointUri += endPointPath;

    reqOptions = {
     url: endPointUri,
     json: true,
     body: data,
     headers: {}
    };    

    if(netrcObj.hasOwnProperty(configs().hostDetails.host)){
            reqOptions['headers']['X-YPCLI-TOKEN'] = netrcObj[configs().hostDetails.host].password;
    } else {
            return callback("You are not logged in. Please login using the command 'yappescli login'");
    } 

    if (operation == "post") {
        request.post(reqOptions, function(error, response, body) {
            if (error) {
                callback(error);
            } else if(body.hasOwnProperty('error')){
				if(body.error.name == 'invalid-credentials') {
					callback("Invalid Credentials. Please enter the correct ones");
				} else {
					formattedError = "ERROR: "+body.error.code+"-"+body.error.message
					callback(formattedError);
				}
			} else {
	            callback(null, body);				
			}
        });
    } else if (operation == "put") {
        request.put(reqOptions, function(error, response, body) {
            if (error) {
                callback(error);
            } else if(body.hasOwnProperty('error')){
				if(body.error.name == 'invalid-credentials') {
					callback("Invalid Credentials. Please enter the correct ones");
				} else {
					formattedError = "ERROR: "+body.error.code+"-"+body.error.message
					callback(formattedError);
				}
			} else {
	            callback(null, body);				
			}
        });
    } else if (operation == "get") {
        request.get(reqOptions, function(error, response, body) {
            if (error) {
                callback(error);
            } else if(body.hasOwnProperty('error')){
				if(body.error.name == 'invalid-credentials') {
					callback("Invalid Credentials. Please enter the correct ones");
				} else {
					formattedError = "ERROR: "+body.error.code+"-"+body.error.message
					callback(formattedError);
				}
			} else {
	            callback(null, body);				
			}
        });
    } else if (operation == "delete") {
        request.delete(reqOptions, function(error, response, body) {
            if (error) {
                callback(error);
            } else if(body.hasOwnProperty('error')){
				if(body.error.name == 'invalid-credentials') {
					callback("Invalid Credentials. Please enter the correct ones");
				} else {
					formattedError = "ERROR: "+body.error.code+"-"+body.error.message
					callback(formattedError);
				}
			} else {
	            callback(null, body);				
			}
        });
    }
}



exports.cliLogin = function(endPointPath, operation, data, callback) {
    let self = this;
    let reqOptions = {};
    let endPointUri = configs().hostDetails.scheme+"://"+configs().hostDetails.host+":"+configs().hostDetails.port+configs().hostDetails.basePath;
    endPointUri += endPointPath;

    if (operation == "post") {
        reqOptions = {
            url: endPointUri,
            json: true,
            body: data
        }
        request.post(reqOptions, function(error, response, body) {
            if (error) {
                callback(error);
            } else if(body.hasOwnProperty('error')){
                if(body.error.name == 'invalid-credentials') {
                    callback("Invalid Credentials. Please enter the correct ones");
                } else {
                    formattedError = "ERROR: "+body.error.code+"-"+body.error.message
                    callback(formattedError);
                }
            } else {
                callback(null, body);               
            }
        });
    } else {
        callback(new Error("Only POST operation supported for Login"));
    }
}