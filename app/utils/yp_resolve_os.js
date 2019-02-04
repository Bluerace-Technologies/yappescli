const path = require('path');
const isWsl = require('is-wsl');

exports.resolveOSCommands = function(){
	let commandOptions = {};

	if(process.platform == "darwin"){
		commandOptions = {
			'create-dir':'mkdir',
			'delete-dir':'rmdir',
			'create-file':'touch',
			'delete-file':'rm'
		};		
	} else if(process.platform == "win32" || isWsl){
		commandOptions = {
			'create-dir':'mkdir',
			'delete-dir':'rmdir',
			'create-file':'type nul >',
			'delete-file':'del'
		};		
	} else {
		commandOptions = {
			'create-dir':'mkdir',
			'delete-dir':'rmdir',
			'create-file':'touch',
			'delete-file':'rm'
		};
	}

	return commandOptions;	
}