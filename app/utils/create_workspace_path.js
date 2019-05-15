
const fs = require('fs');
const isWsl = require('is-wsl');
const nodeCmd = require('node-cmd');
const async = require('async');
const { configs } = require('../configs/yp_configs');
const netrc = require('../utils/netrc');
const { resolveOSCommands } = require('../utils/yp_resolve_os');

function createYpConfig() {
  let configPath = `${process.env.HOME}${configs().getDelimiter()}${configs().configBase}`;
  console.log(configPath);
  let settingsFilePath = '';
  const commandOptions = resolveOSCommands();
  const workspacePath = {
    path: '',
  };
  settingsFilePath = `${configPath}${configs().getDelimiter()}settings.json`;
  async.series([
    function (callback) {
      let cmd = `${commandOptions['create-dir']} ${configPath}`;
            
      nodeCmd.get(cmd, (err, data) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    },
    function (callback) {
      fs.writeFile(settingsFilePath, JSON.stringify(workspacePath), (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    },
    function (callback) {
      let fileName = '';
      if (process.platform == 'win32' || isWsl) {
        fileName = '_netrc';
      } else {
        fileName = '.netrc';
      }
      const netrcFile = netrc.getFilePath();
      const homePath = `${process.env.HOME}${configs().getDelimiter()}${fileName}`;
      if (Object.keys(netrcFile).length === 0) {
        const cmd = `${commandOptions['create-file']} ${homePath}`;
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
    },

  ], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Successfully created the settings file');
    }
  });
}

createYpConfig();
