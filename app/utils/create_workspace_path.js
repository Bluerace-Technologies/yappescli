const fs = require('fs');

exports.createWsPathFile = function () {
  const workspacePath = {
    path: `${process.cwd()}/ypworkspace/`,
  };
  const path = `${process.env.HOME}/.config/yappes/settings.json`;
  fs.writeFile(path, JSON.stringify(workspacePath), (err) => {
    if (err) { return err; }
  });
};
