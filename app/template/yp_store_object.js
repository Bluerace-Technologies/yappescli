const url = require('url');
const netrc = require('netrc');
const httpObj = require('http');
const { configs } = require('../configs/yp_configs');


function YpStoreObject(remoteEndPoint) {
  this.remoteEndPoint = remoteEndPoint;
  this.remoteResponse = {
    result: [],
  };
}


YpStoreObject.prototype.insert = function (collectionName, insertData) {
  const self = this;
  const netrcObj = netrc();
  const hostObj = configs().getHostDetails();
  const apiData = JSON.parse(process.env.ypcontext);
  const storeSettings = {
    storeUrl: 'http://localhost:3001/api/cli/content/store/remote/objects',
    storeReqObj: httpObj,
  };
  const baseUrlParts = url.parse(storeSettings.storeUrl);
  const reqSchemeObj = storeSettings.storeReqObj;
  let writeData = {
    collectionName,
    insertInfo: insertData,
    apiId: apiData.apiHash,
    ownerId: netrcObj[hostObj.host].login,
    operations: 'insert',
  };
  const passThroughHeaders = {
    yid: '',
    'Content-Type': 'application/json',
  };
  const options = {
    host: baseUrlParts.hostname,
    path: baseUrlParts.pathname,
    port: baseUrlParts.port,
    method: 'POST',
    headers: passThroughHeaders,
  };
  if (baseUrlParts.search) {
    options.path += baseUrlParts.search;
  }
  writeData = JSON.stringify(writeData);
  return new Promise(((resolve, reject) => {
    const reqProcess = reqSchemeObj.request(options, (storeResponse) => {
      let responseStream = '';

      storeResponse.on('data', (chunk) => {
        responseStream += chunk;
      });

      storeResponse.on('end', () => {
        resolve(responseStream);
      });
    });
    reqProcess.on('error', (err) => {
      reject(err);
    });
    reqProcess.write(writeData);
    reqProcess.end();
  }));
};

YpStoreObject.prototype.update = function (collectionName, objectReference, updateData) {
  const self = this;
  const netrcObj = netrc();
  const hostObj = configs().getHostDetails();
  const apiData = JSON.parse(process.env.ypcontext);
  const storeSettings = {
    storeUrl: 'http://localhost:3001/api/cli/content/store/remote/objects',
    storeReqObj: httpObj,
  };
  const baseUrlParts = url.parse(storeSettings.storeUrl);
  const reqSchemeObj = storeSettings.storeReqObj;
  let writeData = {
    collectionName,
    updateInfo: updateData,
    apiId: apiData.apiHash,
    ownerId: netrcObj[hostObj.host].login,
    operations: 'update',
    objectId: objectReference,
  };

  const passThroughHeaders = {
    yid: '',
    'Content-Type': 'application/json',
  };
  const options = {
    host: baseUrlParts.hostname,
    path: baseUrlParts.pathname,
    port: baseUrlParts.port,
    method: 'POST',
    headers: passThroughHeaders,
  };
  if (baseUrlParts.search) {
    options.path += baseUrlParts.search;
  }
  writeData = JSON.stringify(writeData);
  return new Promise(((resolve, reject) => {
    const reqProcess = reqSchemeObj.request(options, (storeResponse) => {
      let responseStream = '';

      storeResponse.on('data', (chunk) => {
        responseStream += chunk;
      });

      storeResponse.on('end', () => {
        resolve(responseStream);
      });
    });
    reqProcess.on('error', (err) => {
      reject(err);
    });
    reqProcess.write(writeData);
    reqProcess.end();
  }));
};

YpStoreObject.prototype.query = function (collectionName, queryData) {
  const self = this;
  const netrcObj = netrc();
  const hostObj = configs().getHostDetails();
  const apiData = JSON.parse(process.env.ypcontext);
  const storeSettings = {
    storeUrl: 'http://localhost:3001/api/cli/content/store/remote/objects',
    storeReqObj: httpObj,
  };
  const baseUrlParts = url.parse(storeSettings.storeUrl);
  const reqSchemeObj = storeSettings.storeReqObj;
  let writeData = {
    collectionName,
    queryInfo: queryData,
    apiId: apiData.apiHash,
    ownerId: netrcObj[hostObj.host].login,
    operations: 'query',
  };
  const passThroughHeaders = {
    yid: '',
    'Content-Type': 'application/json',
  };
  const options = {
    host: baseUrlParts.hostname,
    path: baseUrlParts.pathname,
    port: baseUrlParts.port,
    method: 'POST',
    headers: passThroughHeaders,
  };
  if (baseUrlParts.search) {
    options.path += baseUrlParts.search;
  }
  writeData = JSON.stringify(writeData);
  return new Promise(((resolve, reject) => {
    const reqProcess = reqSchemeObj.request(options, (storeResponse) => {
      let responseStream = '';

      storeResponse.on('data', (chunk) => {
        responseStream += chunk;
      });

      storeResponse.on('end', () => {
        resolve(responseStream);
      });
    });
    reqProcess.on('error', (err) => {
      reject(err);
    });
    reqProcess.write(writeData);
    reqProcess.end();
  }));
};
module.exports = YpStoreObject;
