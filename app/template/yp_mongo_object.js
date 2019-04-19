const MongoClient = require('mongodb').MongoClient;

function YpMongoObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.ypContext = JSON.parse(process.env.ypcontext);
    this.remoteDetails = {};
    this.ypContext.ypsettings.forEach(function(config) {
        if (config.configValues.remoteName == remoteEndPoint) {
            this.remoteDetails = config;
        }
    });
    this.remoteResponse = {
        "result": []
    };
}


YpMongoObject.prototype.insert = function(collectionName, insertData) {
    var self = this;
    let mongoConfig = {
        host: remoteDetails.configValues["hostName"],
        port: remoteDetails.configValues["portNumber"],
        user: remoteDetails.configValues["userName"],
        password: remoteDetails.configValues["password"],
        database: remoteDetails.configValues["databaseName"]
    };

    let mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoConfig.port + "/" + mongoConfig.database;
    let mongoSSHConfig = {
        localHost: "",
        localPort: "",
        dstHost: "",
        dstPort: "",
        host: "",
        port: "",
        username: "",
        privateKey: ""
    }

    if (remoteDetails.configValues["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = '127.0.0.1';
        mongoSSHConfig["localPort"] = 27018;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteDetails.configValues["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteDetails.configValues["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteDetails.configValues["sshOptions"]["sshUserName"];
        mongoSSHConfig["privateKey"] = remoteDetails.configValues["sshOptions"]["sshKeyFile"];

        mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoSSHConfig["localPort"] + "/" + mongoConfig.database;

        return new Promise(function(resolve, reject) {
            mongoTunnel(mongoSSHConfig, function(error, mongoServer) {
                if (error) {
                    reject(error);
                } else {
                    let mongoClient = new MongoClient();
                    mongoClient.connect(mongoURI,
                        function(err, dbRemote) {
                            if (err) {
                                mongoServer.close();
                                reject(err);
                            } else {
                                dbRemote.collection(collectionName).insertMany(insertData, function(err, remoteInsertResults) {
                                    dbRemote.close();
                                    mongoServer.close();
                                    if (err)
                                        reject(err);
                                    else {
                                        resolve(remoteInsertResults);
                                    }
                                });
                            }
                        });
                }
            }).on('error', function(remoteSSHError) {
                reject(remoteSSHError);
            });
        });
    } else {
        let mongoClient = new MongoClient();
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoURI, function(err, dbconn) {
                if (err)
                    reject(err);
                else {
                    dbconn.collection(collectionName).insertMany(insertData, function(err, remoteInsertResults) {
                        dbconn.close();
                        if (err)
                            reject(err);
                        else {
                            resolve(remoteInsertResults);
                        }
                    });
                }
            });
        });
    }
}

YpMongoObject.prototype.update = function(collectionName, conditionSet, updateSet, options) {
    var self = this;
    let mongoConfig = {
        host: remoteDetails.configValues["hostName"],
        port: remoteDetails.configValues["portNumber"],
        user: remoteDetails.configValues["userName"],
        password: remoteDetails.configValues["password"],
        database: remoteDetails.configValues["databaseName"]
    };
    let mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoConfig.port + "/" + mongoConfig.database;

    let mongoSSHConfig = {
        localHost: "",
        localPort: "",
        dstHost: "",
        dstPort: "",
        host: "",
        port: "",
        username: "",
        privateKey: ""
    }

    if (remoteDetails.configValues["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = '127.0.0.1';
        mongoSSHConfig["localPort"] = 27018;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteDetails.configValues["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteDetails.configValues["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteDetails.configValues["sshOptions"]["sshUserName"];
        mongoSSHConfig["privateKey"] = remoteDetails.configValues["sshOptions"]["sshKeyFile"];

        mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoSSHConfig["localPort"] + "/" + mongoConfig.database;

        return new Promise(function(resolve, reject) {
            mongoTunnel(mongoSSHConfig, function(error, mongoServer) {
                if (error) {
                    reject(error);
                } else {
                    let mongoClient = new MongoClient();
                    mongoClient.connect(mongoURI,
                        function(err, dbRemote) {
                            if (err) {
                                mongoServer.close();
                                reject(err);
                            } else {
                                dbRemote.collection(collectionName).updateMany(conditionSet, updateSet, options, function(err, remoteUpdateResults) {
                                    dbRemote.close();
                                    mongoServer.close();
                                    if (err)
                                        reject(err);
                                    else {
                                        resolve(remoteUpdateResults);
                                    }
                                });
                            }
                        });
                }
            }).on('error', function(remoteSSHError) {
                reject(remoteSSHError);
            });
        });
    } else {

        let mongoClient = new MongoClient();
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoURI, function(err, dbconn) {
                if (err)
                    reject(err);
                else {
                    dbconn.collection(collectionName).updateMany(conditionSet, updateSet, options, function(err, remoteUpdateResults) {
                        dbconn.close();
                        if (err)
                            reject(err);
                        else {
                            resolve(remoteUpdateResults);
                        }
                    });
                }
            });
        });
    }
}

YpMongoObject.prototype.find = function(collectionName, queryData, limit) {
    var self = this;
    let mongoConfig = {
        host: remoteDetails.configValues["hostName"],
        port: remoteDetails.configValues["portNumber"],
        user: remoteDetails.configValues["userName"],
        password: remoteDetails.configValues["password"],
        database: remoteDetails.configValues["databaseName"]
    };
    let mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoConfig.port + "/" + mongoConfig.database;
    let mongoSSHConfig = {
        localHost: "",
        localPort: "",
        dstHost: "",
        dstPort: "",
        host: "",
        port: "",
        username: "",
        privateKey: ""
    }

    if (remoteDetails.configValues["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = '127.0.0.1';
        mongoSSHConfig["localPort"] = 27018;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteDetails.configValues["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteDetails.configValues["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteDetails.configValues["sshOptions"]["sshUserName"];
        mongoSSHConfig["privateKey"] = remoteDetails.configValues["sshOptions"]["sshKeyFile"];
        mongoURI = "mongodb://" + mongoConfig.user + ":" + mongoConfig.password + "@" + mongoConfig.host + ":" + mongoSSHConfig["localPort"] + "/" + mongoConfig.database;
        return new Promise(function(resolve, reject) {
            mongoTunnel(mongoSSHConfig, function(error, mongoServer) {
                if (error) {
                    reject(error);
                } else {
                    let mongoClient = new MongoClient();
                    mongoClient.connect(mongoURI,
                        function(err, dbRemote) {
                            if (err) {
                                mongoServer.close();
                                reject(err);
                            } else {
                                let remoteQueryResults = [];
                                let remoteQueryCursor = dbRemote.collection(collectionName).find(queryData).limit(limit);
                                remoteQueryCursor.forEach(function(doc) {
                                    if (doc)
                                        remoteQueryResults.push(doc);
                                }, function(err) {
                                    mongoServer.close();
                                    dbRemote.close();
                                    if (err)
                                        reject(err);
                                    dbRemote.close();
                                    resolve(remoteQueryResults);
                                });
                            }
                        });
                }
            }).on('error', function(remoteSSHError) {
                reject(remoteSSHError);
            });
        });
    } else {
        let mongoClient = new MongoClient();
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoURI, function(err, dbconn) {
                if (err)
                    reject(err);
                else {
                    let remoteQueryResults = [];
                    let remoteQueryCursor = dbconn.collection(collectionName).find(queryData).limit(limit);
                    remoteQueryCursor.forEach(function(doc) {
                        if (doc)
                            remoteQueryResults.push(doc);
                    }, function(err) {
                        if (err)
                            reject(err);
                        dbconn.close();
                        resolve(remoteQueryResults);
                    });
                }
            });
        });
    }
}


module.exports = YpMongoObject