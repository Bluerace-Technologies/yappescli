const fs = require('fs');
const netrc = require('../utils/netrc');
const isWsl = require('is-wsl');

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
          host: '192.168.1.7',
          port: 3001,
          scheme: 'http',
          basePath: '/api',
        };
      }
      return hostDetails;
    },
    netrcPath: netrc.getFilePath(),
    configBase: '.yappes',
    getDelimiter() {
      if (process.platform == 'win32' || isWsl) {
        return '\\';
      }
      return '/';
    },
    getConfigSettings(callback) {
      let settingsString = "";
      if (process.platform == 'win32' || isWsl) {
        settingsString = '\\.yappes\\settings.json';
      } else {
        settingsString = '/.yappes/settings.json';
      }
      const configSettingPath = `${process.env.HOME || process.env.USERPROFILE}${settingsString}`;
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
