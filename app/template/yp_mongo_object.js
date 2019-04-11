function YpMongoObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.remoteResponse = {
        "result": []
    };
}


YpMongoObject.prototype.insert = function(collectionName, insertData) {
    /* Supports only Insert*/
    var self = this;

    let mongoConfig = {
        host: remoteSets[this.remoteEndPoint]["hostName"],
        port: remoteSets[this.remoteEndPoint]["portNumber"],
        user: remoteSets[this.remoteEndPoint]["userName"],
        password: remoteSets[this.remoteEndPoint]["password"],
        database: remoteSets[this.remoteEndPoint]["databaseName"]
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
        //readyTimeout: dependentData.sshDefaultParams.readyTimeout,
        //keepaliveInterval: dependentData.sshDefaultParams.keepaliveInterval,
        //keepaliveCountMax: dependentData.sshDefaultParams.keepaliveCountMax
    }

    if (remoteSets[this.remoteEndPoint]["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = dependentData.sshMongoSourceAddress;
        mongoSSHConfig["localPort"] = dependentData.sshMongoSourcePort;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshUserName"];        
        mongoSSHConfig["privateKey"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshKeyFile"];

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
            }).on('error',function(remoteSSHError){
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
        host: remoteSets[this.remoteEndPoint]["hostName"],
        port: remoteSets[this.remoteEndPoint]["portNumber"],
        user: remoteSets[this.remoteEndPoint]["userName"],
        password: remoteSets[this.remoteEndPoint]["password"],
        database: remoteSets[this.remoteEndPoint]["databaseName"]
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
        //readyTimeout: dependentData.sshDefaultParams.readyTimeout,
        //keepaliveInterval: dependentData.sshDefaultParams.keepaliveInterval,
        //keepaliveCountMax: dependentData.sshDefaultParams.keepaliveCountMax
    }

    if (remoteSets[this.remoteEndPoint]["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = dependentData.sshMongoSourceAddress;
        mongoSSHConfig["localPort"] = dependentData.sshMongoSourcePort;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshUserName"];        
        mongoSSHConfig["privateKey"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshKeyFile"];

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
            }).on('error',function(remoteSSHError){
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
        host: remoteSets[this.remoteEndPoint]["hostName"],
        port: remoteSets[this.remoteEndPoint]["portNumber"],
        user: remoteSets[this.remoteEndPoint]["userName"],
        password: remoteSets[this.remoteEndPoint]["password"],
        database: remoteSets[this.remoteEndPoint]["databaseName"]
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
        //readyTimeout: dependentData.sshDefaultParams.readyTimeout,
        //keepaliveInterval: dependentData.sshDefaultParams.keepaliveInterval,
        //keepaliveCountMax: dependentData.sshDefaultParams.keepaliveCountMax
    }

    if (remoteSets[this.remoteEndPoint]["sshOptions"]["enabled"]) {
        mongoSSHConfig["localHost"] = dependentData.sshMongoSourceAddress;
        mongoSSHConfig["localPort"] = dependentData.sshMongoSourcePort;
        mongoSSHConfig["dstHost"] = mongoConfig.host;
        mongoSSHConfig["dstPort"] = mongoConfig.port;
        mongoSSHConfig["host"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshHostName"];
        mongoSSHConfig["port"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshPortNumber"];
        mongoSSHConfig["username"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshUserName"];        
        mongoSSHConfig["privateKey"] = remoteSets[this.remoteEndPoint]["sshOptions"]["sshKeyFile"];
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
            }).on('error',function(remoteSSHError){
                reject(remoteSSHError);
            });
        });
    } else {
        let mongoClient = new MongoClient();
        return new Promise(function(resolve, reject) {
            mongoclient.connect(mongoURI, function(err, dbconn) {
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