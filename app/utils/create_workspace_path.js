const fs = require('fs');
const isWsl = require('is-wsl');
const { configs } = require('../configs/yp_configs');
const { resolveOSCommands } = require('../utils/yp_resolve_os');

exports.createYpConfig = function() {
    const configPath = `${process.env.HOME}/${configs.configBase}`;
    let settingsFilePath = '';
    const commandOptions = resolveOSCommands();
    const workspacePath = {
      path: "",
    };
    settingsFilePath = `${configPath}/settings.json`;
    const cmd = `${commandOptions['create-dir']} -p ${configPath}`;
    nodeCmd.get(cmd, (err, data) => {
        if (err) {
            callback(err);
        } else {
            fs.writeFile(settingsFilePath, JSON.stringify(workspacePath), (err) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, workspacePath.path);
                }
            });
        }
    });
};

createWsPathFile();