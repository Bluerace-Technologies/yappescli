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
          host: '192.168.1.9',
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
       } else {
        return '/';
       }
    },
    getConfigSettings(callback) {
      const configSettingPath = `${process.env.HOME||process.env.USERPROFILE}\\.yappes\\settings.json`;
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
