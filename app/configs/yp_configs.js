const fs = require('fs');

exports.configs = function() {
    return {
        hostDetails: {
            host: "localhost",
            port: 3001,
            scheme: "http",
            basePath: "/api"
        },
        netrcPath: process.env.HOME + "/.netrc",
        getConfigSettings: function(callback) {
            let configSettingPath = process.env.HOME + '/.config/yappes/settings.json';
            fs.readFile(configSettingPath, 'utf8', function(err, data) {
                if (err) { 
                	callback(err); 
                } else {
                    callback(null, data);
                }
            });
        }
    }
}