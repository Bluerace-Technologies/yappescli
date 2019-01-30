

function YappesCliProcessor() {
	this.apiPath = {
		'login': function(){
			return "/token/auth/cli";
		}
	};
	this.resolvePath = "./commands/";
}


YappesCliProcessor.prototype.loadCommand = function(command){
	let self = this;
	try{
		require.resolve(self.resolvePath+command);
		return require(self.resolvePath+command);
	} catch (e){
		return false;
	}

}


YappesCliProcessor.prototype.executeCommand = function(command, inputData, callback){
	let self = this;
	let commandModule = self.loadCommand(command);
	if(typeof commandModule == "function"){
		
		if(self.apiPath[command]){
			inputData["endPointPath"] = self.apiPath[command]();
		} else {
			inputData["endPointPath"] = "not-required";
		}
		
		commandModule(inputData,function(err, apiResults){
			if(err){
				callback(err); 
			} else {
				callback(null, apiResults);
			}
		});
	} else {
		callback('Invalid Command');
	}

}

module.exports = YappesCliProcessor