const fs = require('fs');
const netrc = require('../utils/netrc');

exports.configs = function configs() {
  return {
    getHostDetails() {
      let hostDetails = {};
      if (process.env.YAPPES_ENV == 'development') {
        hostDetails = {
          host: 'localhost',
          port: 3001,
          scheme: 'http',
          basePath: '/api',
        };
      } else {
        hostDetails = {
          host: 'cli.yappes.com',
          port: 98,
          scheme: 'http',
          basePath: '/api',
        };
      }
      return hostDetails;
    },
    netrcPath: netrc.getFilePath(),
    configBase: '.yappes',
    getConfigSettings(callback) {
      const configSettingPath = `${process.env.HOME}/.yappes/settings.json`;
      fs.readFile(configSettingPath, 'utf8', (err, data) => {
        if (err) {
          callback(err);
        } else {
          callback(null, data);
        }
      });
    },
  };
};
