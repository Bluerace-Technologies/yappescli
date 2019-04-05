const fs = require('fs');

exports.configs = function() {
    return {
        getHostDetails: function() {
            let hostDetails = {};
            if (process.env.YAPPES_ENV = 'development') {
                hostDetails = {
                    host: "localhost",
                    port: 3001,
                    scheme: "http",
                    basePath: "/api"
                }
            } else {
                hostDetails = {
                    host: "cli.yappes.com",
                    port: 80,
                    scheme: "https",
                    basePath: "/api"
                }
            }
            return hostDetails;
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