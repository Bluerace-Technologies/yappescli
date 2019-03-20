const fs = require('fs');
exports.createWsPathFile = function() {
    let workspacePath = {
        "path": process.cwd() + '/ypworkspace/'
    };
    let path = process.env.HOME + '/.config/yappes/settings.json';
    fs.writeFile(path, JSON.stringify(workspacePath), function(err) {
        if (err) { return err } else {
            return;
        }
    });
}