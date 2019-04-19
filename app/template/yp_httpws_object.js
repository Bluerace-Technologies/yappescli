let url = require('url');
let querystring = require('querystring');
let wshttps = require('https');
let wshttp = require('http');

function YpWebserviceObject(remoteEndPoint) {
    this.ypContext = JSON.parse(process.env.ypcontext);
    this.remoteEndPoint = remoteEndPoint;
    this.remoteResponse = {
        "result": []
    };
    this.reqSchemeObj = wshttps;
    this.endPoint = {};
    for (let rmCount = 0; rmCount < this.ypContext.ypsettings.length; rmCount++) {
        if (this.ypContext.ypsettings[rmCount].configValues.remoteName == remoteEndPoint) {
            this.endPoint = this.ypContext.ypsettings[rmCount].configValues;
        }

    }
}
YpWebserviceObject.prototype.setSchemeObj = function() {
    let url_parts = url.parse(this.endPoint.url);
    if (url_parts.protocol == "https") {
        this.reqSchemeObj = wshttps;
    } else {
        this.reqSchemeObj = wshttp;
    }
}

YpWebserviceObject.prototype.createOp = function(options) {
    if (options.qs) {
        options.path = options.path + "?" + querystring.stringify(options.qs);
    }
    return options;
}

YpWebserviceObject.prototype.wsget = function(options) {
    let self = this;
    let responseChunk = "";
    let url_parts = url.parse(this.endPoint.url);
    options.host = url_parts.hostname;
    options.port = url_parts.port;
    options.method = "GET";
    let option = self.createOp(options);
    self.setSchemeObj();
    return new Promise(function(resolve, reject) {
        var req = self.reqSchemeObj.request(option, function(res) {
            res.on('data', function(chunk) {
                responseChunk += chunk;
            });
            res.on('end', function() {
                resolve(responseChunk);
            });
        });

        req.on('error', function(err) {
            reject(err);
        });

        req.end();
    });
}
YpWebserviceObject.prototype.wspost = function(options, data) {
    let self = this;
    let url_parts = url.parse(this.endPoint.url);
    options.host = url_parts.hostname;
    options.port = url_parts.port;
    options.method = "POST";
    let option = self.createOp(options);
    self.setSchemeObj();
    return new Promise(function(resolve, reject) {
        var req = self.reqSchemeObj.request(option, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(responseData) {
                resolve(responseData);
            });
        });

        req.on('error', function(e) {
            reject(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}
YpWebserviceObject.prototype.wsput = function(options, data) {
    let self = this;
    let url_parts = url.parse(this.endPoint.url);
    options.host = url_parts.hostname;
    options.port = url_parts.port;
    options.method = "PUT";
    let option = self.createOp(options);
    self.setSchemeObj();
    return new Promise(function(resolve, reject) {
        var req = self.reqSchemeObj.request(option, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(responseData) {
                resolve(responseData);
            });
        });

        req.on('error', function(e) {
            reject(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}
YpWebserviceObject.prototype.wsdelete = function(options, data) {
    let self = this;
    let url_parts = url.parse(this.endPoint.url);
    options.host = url_parts.hostname;
    options.port = url_parts.port;
    options.method = "DELETE";
    let option = self.createOp(options);
    self.setSchemeObj();
    return new Promise(function(resolve, reject) {
        var req = self.reqSchemeObj.request(option, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(responseData) {
                resolve(responseData);
            });
        });

        req.on('error', function(e) {
            reject(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}


module.exports = YpWebserviceObject