let url = require('url');
function YpStoreObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.remoteResponse = {
        "result": []
    };
}


YpStoreObject.prototype.insert = function(collectionName, insertData) {
    var self = this;
    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName":collectionName,
        "insertInfo":insertData,
        "apiId":dependentData.apiId,
        "ownerId":dependentData.ownerId,
        "operations":"insert"
    }

    let passThroughHeaders = {
        "yid": dependentData.yid,
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
    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName":collectionName,
        "updateInfo":updateData,
        "apiId":dependentData.apiId,
        "ownerId":dependentData.ownerId,
        "operations":"update",
        "objectId":objectReference
    }

    let passThroughHeaders = {
        "yid": dependentData.yid,
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

    let baseUrlParts = url.parse(storeSettings.storeUrl);
    let reqSchemeObj = storeSettings.storeReqObj;
    let writeData = {
        "collectionName":collectionName,
        "queryInfo":queryData,
        "apiId":dependentData.apiId,
        "ownerId":dependentData.ownerId,
        "operations":"query"
    }

    let passThroughHeaders = {
        "yid": dependentData.yid,
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