const url = require('url');
const querystring = require('querystring');
const wshttps = require('https');
const wshttp = require('http');

function YpWebserviceObject(remoteEndPoint) {
  this.ypContext = JSON.parse(process.env.ypcontext);
  this.remoteEndPoint = remoteEndPoint;
  this.remoteResponse = {
    result: [],
  };
  this.reqSchemeObj = wshttps;
  this.endPoint = {};
  for (let rmCount = 0; rmCount < this.ypContext.ypsettings.length; rmCount++) {
    if (this.ypContext.ypsettings[rmCount].configValues.remoteName == remoteEndPoint) {
      this.endPoint = this.ypContext.ypsettings[rmCount].configValues;
    }
  }
}
YpWebserviceObject.prototype.setSchemeObj = function () {
  const url_parts = url.parse(this.endPoint.url);
  if (url_parts.protocol == 'https') {
    this.reqSchemeObj = wshttps;
  } else {
    this.reqSchemeObj = wshttp;
  }
};

YpWebserviceObject.prototype.createOp = function (options) {
  if (options.qs) {
    options.path = `${options.path}?${querystring.stringify(options.qs)}`;
  }
  return options;
};

YpWebserviceObject.prototype.wsget = function (options) {
  const self = this;
  let responseChunk = '';
  const url_parts = url.parse(this.endPoint.url);
  options.host = url_parts.hostname;
  options.port = url_parts.port;
  options.method = 'GET';
  const option = self.createOp(options);
  self.setSchemeObj();
  return new Promise(((resolve, reject) => {
    const req = self.reqSchemeObj.request(option, (res) => {
      res.on('data', (chunk) => {
        responseChunk += chunk;
      });
      res.on('end', () => {
        resolve(responseChunk);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  }));
};
YpWebserviceObject.prototype.wspost = function (options, data) {
  const self = this;
  const url_parts = url.parse(this.endPoint.url);
  options.host = url_parts.hostname;
  options.port = url_parts.port;
  options.method = 'POST';
  const option = self.createOp(options);
  self.setSchemeObj();
  return new Promise(((resolve, reject) => {
    const req = self.reqSchemeObj.request(option, (res) => {
      res.setEncoding('utf8');
      res.on('data', (responseData) => {
        resolve(responseData);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(data));
    req.end();
  }));
};
YpWebserviceObject.prototype.wsput = function (options, data) {
  const self = this;
  const url_parts = url.parse(this.endPoint.url);
  options.host = url_parts.hostname;
  options.port = url_parts.port;
  options.method = 'PUT';
  const option = self.createOp(options);
  self.setSchemeObj();
  return new Promise(((resolve, reject) => {
    const req = self.reqSchemeObj.request(option, (res) => {
      res.setEncoding('utf8');
      res.on('data', (responseData) => {
        resolve(responseData);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(data));
    req.end();
  }));
};
YpWebserviceObject.prototype.wsdelete = function (options, data) {
  const self = this;
  const url_parts = url.parse(this.endPoint.url);
  options.host = url_parts.hostname;
  options.port = url_parts.port;
  options.method = 'DELETE';
  const option = self.createOp(options);
  self.setSchemeObj();
  return new Promise(((resolve, reject) => {
    const req = self.reqSchemeObj.request(option, (res) => {
      res.setEncoding('utf8');
      res.on('data', (responseData) => {
        resolve(responseData);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(data));
    req.end();
  }));
};


module.exports = YpWebserviceObject;
