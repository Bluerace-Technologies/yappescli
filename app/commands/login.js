const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');

let ypRequest = require('../utils/yp_request');

module.exports = function(processingData,callback){
	let fpath = configs().netrcPath;
	let netrcObj = netrc();
	let data ={
		emailId:processingData.username,
		password:processingData.password
	};
	let endPointUri = configs().hostDetails.scheme+"://"+configs().hostDetails.host+":"+configs().hostDetails.port;

	endPointUri+=processingData.endPointPath;

	ypRequest.call(endPointUri,"post",data,function(err, apiResponse){
		if(err){
			callback(error);
		} else {
			netrcObj[configs().hostDetails.host] = {
				login:processingData.username,
				password:apiResponse.data.ypToken
			};
			netrc.save(netrcObj);
			callback(null, "Successfully authenticated!!");
		}
	});	
}