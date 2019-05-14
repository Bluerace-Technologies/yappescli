/**
 * Taken from https://github.com/camshaft/netrc index.js
 */
/**
 * Module dependencies
 */

var fs = require('fs');
var join = require('path').join;
var isWsl = require('is-wsl');

/**
 * Read and parse .netrc
 *
 * @param {String} file
 * @return {Object}
 * @api public
 */

module.exports = exports = function(file) {
  var home = getHomePath();

  if (!file && !home) return {};
  file = file || home;

  if (!file || !fs.existsSync(file)) return {};
  var netrc = fs.readFileSync(file, 'UTF-8');
  return exports.parse(netrc);
};

/**
 * Parse netrc
 *
 * @param {String} content
 * @return {Object}
 * @api public
 */

exports.parse = function(content) {
  // Remove comments
  var lines = content.split('\n');
  for (var n in lines) {
    var i = lines[n].indexOf('#');
    if (i > -1) lines[n] = lines[n].substring(0, i);
  }
  content = lines.join('\n');

  var tokens = content.split(/[ \t\n\r]+/);
  var machines = {};
  var m = null;
  var key = null;

  // if first index in array is empty string, strip it off (happens when first line of file is comment. Breaks the parsing)
  if (tokens[0] === '') tokens.shift();

  for(var i = 0, key, value; i < tokens.length; i+=2) {
    key = tokens[i];
    value = tokens[i+1];

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

  return machines
};

/**
 * Generate contents of netrc file from objects.
 * @param {Object} machines as returned by `netrc.parse`
 * @return {String} text of the netrc file
 */

exports.format = function format(machines){
  var lines = [];
  var keys = Object.getOwnPropertyNames(machines).sort();

  keys.forEach(function(key){
    lines.push('machine ' + key);
    var machine = machines[key];
    var attrs = Object.getOwnPropertyNames(machine).sort();
    attrs.forEach(function(attr){
      if (typeof(machine[attr]) === 'string') lines.push('    ' + attr + ' ' + machine[attr]);
    });
  });
  return lines.join('\n');
};

/**
 * Serialise contents objects to netrc file.
 *
 * @param {Object} machines as returned by `netrc.parse`
 * @api public
 */

exports.save = function save(machines){
  var home = getHomePath();
  var destFile = home;
  var data = exports.format(machines) + '\n';
  fs.writeFileSync(destFile, data);
};

exports.getFilePath = function getFilePath(){
  return getHomePath();
}

function getFileType() {
  if (process.platform == "win32" || isWsl) {
    return "_netrc";
  } else {
    return ".netrc";
  }
}

/**
 * Get the home path
 *
 * @return {String} path to home directory
 * @api private
 */

function getHomePath() {
  const unixDefault = ["NETRC","HOME"];
  const winDefault = ["NETRC","HOME","USERPROFILE"];
  let fileFound = false;
  if (process.platform == "win32" || isWsl) {
    for(let ucount=0; ucount<winDefault.length; ucount++){
      let absolutePath = process.env[winDefault[ucount]]+"\\_netrc";
      if(fs.existsSync(absolutePath)){
        fileFound = true;
        return absolutePath;
      }
    }
  } else {
    for(let ucount=0; ucount<unixDefault.length; ucount++){
      let absolutePath = process.env[unixDefault[ucount]]+"/.netrc";
      if(fs.existsSync(absolutePath)){
        fileFound = true;
        return absolutePath;
      }
    }
  }

  if(!fileFound)
    return {};
}