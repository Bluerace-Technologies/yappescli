/**
 * Taken from https://github.com/camshaft/netrc index.js
 */
/**
 * Module dependencies
 */

const fs = require('fs');
const { join } = require('path');
const isWsl = require('is-wsl');

/**
 * Read and parse .netrc
 *
 * @param {String} file
 * @return {Object}
 * @api public
 */

module.exports = exports = function (file) {
  const home = getHomePath();

  if (!file && !home) return {};
  file = file || home;

  if (!file || !fs.existsSync(file)) return {};
  const netrc = fs.readFileSync(file, 'UTF-8');
  return exports.parse(netrc);
};

/**
 * Parse netrc
 *
 * @param {String} content
 * @return {Object}
 * @api public
 */

exports.parse = function (content) {
  // Remove comments
  const lines = content.split('\n');
  for (const n in lines) {
    var i = lines[n].indexOf('#');
    if (i > -1) lines[n] = lines[n].substring(0, i);
  }
  content = lines.join('\n');

  const tokens = content.split(/[ \t\n\r]+/);
  const machines = {};
  let m = null;
  var key = null;

  // if first index in array is empty string, strip it off (happens when first line of file is comment. Breaks the parsing)
  if (tokens[0] === '') tokens.shift();

  for (var i = 0, key, value; i < tokens.length; i += 2) {
    key = tokens[i];
    value = tokens[i + 1];

    // Whitespace
    if (!key || !value) continue;

    // We have a new machine definition
    if (key === 'machine') {
      m = {};
      machines[value] = m;
    }
    // key=value
    else {
      m[key] = value;
    }
  }

  return machines;
};

/**
 * Generate contents of netrc file from objects.
 * @param {Object} machines as returned by `netrc.parse`
 * @return {String} text of the netrc file
 */

exports.format = function format(machines) {
  const lines = [];
  const keys = Object.getOwnPropertyNames(machines).sort();

  keys.forEach((key) => {
    lines.push(`machine ${key}`);
    const machine = machines[key];
    const attrs = Object.getOwnPropertyNames(machine).sort();
    attrs.forEach((attr) => {
      if (typeof (machine[attr]) === 'string') lines.push(`    ${attr} ${machine[attr]}`);
    });
  });
  return lines.join('\n');
};

/**
 * Get the home path
 *
 * @return {String} path to home directory
 * @api private
 */

function getHomePath() {
  const unixDefault = ['NETRC', 'HOME'];
  const winDefault = ['NETRC', 'HOME', 'USERPROFILE'];
  let fileFound = false;
  if (process.platform == 'win32' || isWsl) {
    for (let ucount = 0; ucount < winDefault.length; ucount++) {
      const absolutePath = `${process.env[winDefault[ucount]]}\\_netrc`;
      if (fs.existsSync(absolutePath)) {
        fileFound = true;
        return absolutePath;
      }
    }
  } else {
    for (let ucount = 0; ucount < unixDefault.length; ucount++) {
      const absolutePath = `${process.env[unixDefault[ucount]]}/.netrc`;
      if (fs.existsSync(absolutePath)) {
        fileFound = true;
        return absolutePath;
      }
    }
  }

  if (!fileFound) return {};
}

/**
 * Serialise contents objects to netrc file.
 *
 * @param {Object} machines as returned by `netrc.parse`
 * @api public
 */

exports.save = function save(machines) {
  const home = getHomePath();
  const destFile = home;
  const data = `${exports.format(machines)}\n`;
  fs.writeFileSync(destFile, data);
};

exports.getFilePath = function getFilePath() {
  return getHomePath();
};

function getFileType() {
  if (process.platform == 'win32' || isWsl) {
    return '_netrc';
  }
  return '.netrc';
}
