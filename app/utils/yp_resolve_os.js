const isWsl = require('is-wsl');

exports.resolveOSCommands = function resolveOSCommands() {
  let commandOptions = {};

  if (process.platform == 'darwin') {
    commandOptions = {
      'create-dir': 'mkdir -p',
      'delete-dir': 'rmdir',
      'create-file': 'touch',
      'delete-file': 'rm',
      'insert-into-file': 'echo',
    };
  } else if (process.platform == 'win32' || isWsl) {
    commandOptions = {
      'create-dir': 'mkdir',
      'delete-dir': 'rmdir',
      'create-file': 'type nul >',
      'delete-file': 'del',
      'insert-into-file': 'echo',
    };
  } else {
    commandOptions = {
      'create-dir': 'mkdir -p',
      'delete-dir': 'rmdir',
      'create-file': 'touch',
      'delete-file': 'rm',
      'insert-into-file': 'echo',
    };
  }

  return commandOptions;
};
