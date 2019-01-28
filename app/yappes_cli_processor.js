
function YappesCliProcessor() {
	this.lookUpPath = {
		'login': function(){
			return "/api/token/auth/cli";
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
		
		if(self.lookUpPath[command]){
			inputData["endPointPath"] = self.lookUpPath[command]();
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