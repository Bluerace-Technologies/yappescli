exports.configs = function(){
	return {
		hostDetails:{
			host:"cli-oauth.yappes.local", 
			port:3001,
			scheme: "http"
		},
		netrcPath: process.env.HOME + "/.netrc" 
	}
}