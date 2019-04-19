let url = require('url');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');

function YpStoreObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.remoteResponse = {
        "result": []
    };
}


YpStoreObject.prototype.insert = function(collectionName, insertData) {
    var self = this;
    let netrcObj = netrc();
    let hostObj = configs().getHostDetails();
    let apiData = JSON.parse(process.env.ypcontext);
    let storeSettings = {
        storeUrl: "http://localhost:3001/api/cli/content/store/remote/objects",
        storeReqObj: require('http')
    }
    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName": collectionName,
        "insertInfo": insertData,
        "apiId": apiData.apiHash,
        "ownerId": netrcObj[hostObj.host].login,
        "operations": "insert"
    }
    let passThroughHeaders = {
        "yid": '',
        "Content-Type": "application/json"
    }
    let options = {
        host: baseUrlParts.hostname,
        path: baseUrlParts.pathname,
        port: baseUrlParts.port,
        method: 'POST',
        headers: passThroughHeaders
    };
    if (baseUrlParts.search) {
        options.path += baseUrlParts.search;
    }
    writeData = JSON.stringify(writeData);
    return new Promise(function(resolve, reject) {
        let reqProcess = reqSchemeObj.request(options, function(storeResponse) {
            let responseStream = '';

            storeResponse.on('data', function(chunk) {
                responseStream += chunk;
            });

            storeResponse.on('end', function() {
                resolve(responseStream);
            });
        });
        reqProcess.on('error', function(err) {
            reject(err);
        });
        reqProcess.write(writeData);
        reqProcess.end();
    });
}

YpStoreObject.prototype.update = function(collectionName, objectReference, updateData) {
    var self = this;
    let netrcObj = netrc();
    let hostObj = configs().getHostDetails();
    let apiData = JSON.parse(process.env.ypcontext);
    let storeSettings = {
        storeUrl: "http://localhost:3001/api/cli/content/store/remote/objects",
        storeReqObj: require('http')
    }
    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName": collectionName,
        "updateInfo": updateData,
        "apiId": apiData.apiHash,
        "ownerId": netrcObj[hostObj.host].login,
        "operations": "update",
        "objectId": objectReference
    }

    let passThroughHeaders = {
        "yid": '',
        "Content-Type": "application/json"
    }
    let options = {
        host: baseUrlParts.hostname,
        path: baseUrlParts.pathname,
        port: baseUrlParts.port,
        method: 'POST',
        headers: passThroughHeaders
    };
    if (baseUrlParts.search) {
        options.path += baseUrlParts.search;
    }
    writeData = JSON.stringify(writeData);
    return new Promise(function(resolve, reject) {
        let reqProcess = reqSchemeObj.request(options, function(storeResponse) {
            let responseStream = '';

            storeResponse.on('data', function(chunk) {
                responseStream += chunk;
            });

            storeResponse.on('end', function() {
                resolve(responseStream);
            });
        });
        reqProcess.on('error', function(err) {
            reject(err);
        });
        reqProcess.write(writeData);
        reqProcess.end();
    });
}

YpStoreObject.prototype.query = function(collectionName, queryData) {
    var self = this;
    let netrcObj = netrc();
    let hostObj = configs().getHostDetails();
    let apiData = JSON.parse(process.env.ypcontext);
    let storeSettings = {
        storeUrl: "http://localhost:3001/api/cli/content/store/remote/objects",
        storeReqObj: require('http')
    }
    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName": collectionName,
        "queryInfo": queryData,
        "apiId": apiData.apiHash,
        "ownerId": netrcObj[hostObj.host].login,
        "operations": "query"
    }
    let passThroughHeaders = {
        "yid": '',
        "Content-Type": "application/json"
    }
    let options = {
        host: baseUrlParts.hostname,
        path: baseUrlParts.pathname,
        port: baseUrlParts.port,
        method: 'POST',
        headers: passThroughHeaders
    };
    if (baseUrlParts.search) {
        options.path += baseUrlParts.search;
    }
    writeData = JSON.stringify(writeData);
    return new Promise(function(resolve, reject) {
        let reqProcess = reqSchemeObj.request(options, function(storeResponse) {
            let responseStream = '';

            storeResponse.on('data', function(chunk) {
                responseStream += chunk;
            });

            storeResponse.on('end', function() {
                resolve(responseStream);
            });
        });
        reqProcess.on('error', function(err) {
            reject(err);
        });
        reqProcess.write(writeData);
        reqProcess.end();
    });
}
module.exports = YpStoreObject