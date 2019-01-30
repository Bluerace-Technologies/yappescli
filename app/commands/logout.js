const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');
let {resolveOSCommands} = require('../utils/yp_resolve_os');


module.exports = function(processingData, callback){
    let fpath = configs().netrcPath;
    let netrcObj = netrc();
    let loginUser = "";

    if(netrcObj.hasOwnProperty(configs().hostDetails.host)){
    	delete netrcObj[configs().hostDetails.host];
    	netrc.save(netrcObj);
    	callback(null, "Logout done!!");
    } else {
    	callback("You are not logged in. Please login using the command 'yappescli login'");
    }
}