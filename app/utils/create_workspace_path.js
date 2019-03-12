const fs = require('fs');
exports.createWsPathFile = function() {
    let workspacePath = {
        "path": process.cwd() + '/ypworkspace/'
    };
    let path = process.env.HOME + '/.config/.yp_workspace_path.json';
    fs.writeFile(path, JSON.stringify(workspacePath), function(err) {
        if (err) { return err } else {
            return;
        }
    });
}