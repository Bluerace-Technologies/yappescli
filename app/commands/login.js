const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let {resolveOSCommands} = require('../utils/yp_resolve_os');

module.exports = function(processingData,callback){
	let fpath = configs().netrcPath;
	let hostObj=configs().getHostDetails();
	let netrcObj = netrc();
	let data ={
		emailId:processingData.username,
		password:processingData.password
	};

	ypRequest.cliLogin(processingData.endPointPath,"post",data,function(err, apiResponse){
		if(err){
			callback(err);
		} else {
			netrcObj[hostObj.host] = {
				login:processingData.username,
				password:apiResponse.data.ypToken
			};
			netrc.save(netrcObj);
			callback(null, "Successfully authenticated!!");
		}
	});	
}