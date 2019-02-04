const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');
let {resolveOSCommands} = require('../utils/yp_resolve_os');


module.exports = function(processingData, callback){
    let fpath = configs().netrcPath;
    let netrcObj = netrc();
    let loginUser = "";
    let commandOptions = resolveOSCommands();

    if(netrcObj.hasOwnProperty(configs().hostDetails.host)){
    	loginUser = netrcObj[configs().hostDetails.host].login;
        console.log(netrcObj[configs().hostDetails.host]);
    	callback(null, loginUser);
    } else {
    	callback("You are not logged in. Please login using the command 'yappescli login'");
    }
}