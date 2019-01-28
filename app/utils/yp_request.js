const request = require('request');


exports.call = function(endpointUri, operation, data, callback) {
    let self = this;
    let reqOptions = {};
    if (operation == "post") {
        reqOptions = {
            url: endpointUri,
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
	            callback(null, body)				
			}
        });
    } else if (operation == "put") {
        reqOptions = {
            url: endpointUri,
            json: true,
            body: data
        }
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
	            callback(null, body)				
			}
        });
    } else if (operation == "get") {
        reqOptions = {
            url: endpointUri,
            json: true,
            body: data
        }
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
	            callback(null, body)				
			}
        });
    } else if (operation == "delete") {
        reqOptions = {
            url: endpointUri,
            json: true,
            body: data
        }
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
	            callback(null, body)				
			}
        });
    }
}