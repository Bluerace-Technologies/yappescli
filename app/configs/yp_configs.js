exports.configs = function(){
	return {
		hostDetails:{
			host:"localhost", 
			port:3001,
			scheme: "http",
			basePath:"/api"
		},
		netrcPath: process.env.HOME + "/.netrc" 
	}
}