program
	.command('oauthlogin')
	.alias('l')
	.description('Login to Yappes')
	.action(function() {
		inquirer.prompt(loginQuestion).then(function(answers){
			if(answers!="q"){
				// 1st approach
				(async function(){
					await ypopn('http://yappes.local/login',{"wait":true});
					//console.log(response);
				})();
				
				// 2nd approach
				opn('http://yappes.local/login',{"wait":true}).then(function(results){
					console.log("resulst");
				},function(err){
					if(err){
						console.log("err");
					}
				});

				// 3rd approach
				let childObj = spawn('/usr/bin/xdg-open', ['http://yappes.local']);
				childObj.stdout.on('data',function(data){
					console.log('stdout: ' + data);
				});
				childObj.stderr.on('error',function(data){
					console.log('stderror: ' + data);
				});
				childObj.on('close',function(data){
					console.log('srdclose: ' + data);
				});
				childObj.on('error',function(data){
					console.log('error: ' + data);
				});
			}		
		});
	});	