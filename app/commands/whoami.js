const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');


module.exports = function(processingData, callback){
    let fpath = configs().netrcPath;
    let netrcObj = netrc();
    let loginUser = "";

    if(netrcObj.hasOwnProperty(configs().hostDetails.host)){
    	loginUser = netrcObj[configs().hostDetails.host].login;
    	callback(null, loginUser);
    } else {
    	callback("You are not logged in. Please login using the command 'yappescli login'");
    }
}