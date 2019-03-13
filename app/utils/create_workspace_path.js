const fs = require('fs');
const isWsl = require('is-wsl');

createWsPathFile = function() {
    let path = "";
    if (process.platform == "win32" || isWsl) {
        path = process.env.HOME + '/AppData/Roaming/npm/yp_workspace_path.json';
    } else {
        path = process.env.HOME + '/.config/.yp_workspace_path.json';
    }
    let workspacePath = {
        "path": process.cwd() + '/ypworkspace/'
    };
    fs.writeFile(path, JSON.stringify(workspacePath), function(err) {
        if (err) { return err } else {
            return;
        }
    });
}
createWsPathFile();