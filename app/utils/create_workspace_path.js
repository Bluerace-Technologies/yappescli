const fs = require('fs');
const isWsl = require('is-wsl');
const nodeCmd = require('node-cmd');
const async = require('async');
const { configs } = require('../configs/yp_configs');
const netrc = require('../utils/netrc');
const { resolveOSCommands } = require('../utils/yp_resolve_os');

createYpConfig = function() {
    const configPath = `${process.env.HOME}/${configs().configBase}`;
    let settingsFilePath = '';
    const commandOptions = resolveOSCommands();
    const workspacePath = {
        path: "",
    };
    settingsFilePath = `${configPath}/settings.json`;
    async.series([
        function(callback) {
            let cmd = `${commandOptions['create-dir']} -p ${configPath}`;
            nodeCmd.get(cmd, (err, data) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        },
        function(callback) {
            fs.writeFile(settingsFilePath, JSON.stringify(workspacePath), (err) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        },
        function(callback){
            let fileName = '';
              if (process.platform == "win32" || isWsl) {
                fileName = "_netrc";
              } else {
                fileName = ".netrc";
              }
            let netrcFile =  netrc.getFilePath();
            let homePath = `${process.env.HOME}/${fileName}`;
            if(Object.keys(netrcFile).length === 0 ){
               let cmd = `${commandOptions['create-file']} ${homePath}`;
                nodeCmd.get(cmd, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            } else {
                callback(null);
            }
        }

    ], function(err, results) {
        if(err){
            console.log(err);
        } else {
            console.log("Successfully created the settings file");
        }

    });

};

createYpConfig();