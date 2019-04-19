const mysql = require("mysql");
const Client = require('ssh2').Client;
const mysql2 = require('mysql2');
const fs = require('fs');
let tunnel = require('tunnel-ssh');

function YpMysqlObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.ypContext = JSON.parse(process.env.ypcontext);
    this.remoteDetails = {};
    for (let rmCount = 0; rmCount < this.ypContext.ypsettings.length; rmCount++) {
        if (this.ypContext.ypsettings[rmCount].configValues.remoteName == remoteEndPoint) {
            this.remoteDetails = this.ypContext.ypsettings[rmCount];
        }

    }
    this.remoteConfigDetails = {
        hostName: "",
        portNumber: ""
    }
    this.remoteResponse = {
        "result": []
    };
}

YpMysqlObject.prototype.setConnection = function() {
    var self = this;
}

YpMysqlObject.prototype.execute = function(statement, args) {
    var self = this;
    statement = statement.trim();
    let regExp = new RegExp(/^(insert\s|update\s)/, "i");
    let sbObjssh = new sbClient();
    if (regExp.test(statement)) {
        let mysqlConfig = {
            host: remoteDetails.configValues["hostName"],
            port: remoteDetails.configValues["portNumber"],
            user: remoteDetails.configValues["userName"],
            password: remoteDetails.configValues["password"],
            database: remoteDetails.configValues["databaseName"]
        }

        let mysqlSSHConfig = {
            sourceAddress: "",
            sourcePort: "",
            destinationAddress: "",
            destinationPort: "",
            host: "",
            port: "",
            username: "",
            password: "",
            privateKey: "",
            readyTimeout: 10000,
            keepaliveInterval: 1000,
            keepaliveCountMax: 3
        }

        if (remoteDetails.configValues["sshOptions"]["enabled"]) {
            mysqlSSHConfig["sourceAddress"] = "127.0.0.1";
            mysqlSSHConfig["sourcePort"] = 3310;
            mysqlSSHConfig["destinationAddress"] = 'localhost';
            mysqlSSHConfig["destinationPort"] = '3306';
            mysqlSSHConfig["host"] = remoteDetails.configValues["sshOptions"]["sshHostName"];
            mysqlSSHConfig["port"] = remoteDetails.configValues["sshOptions"]["sshPortNumber"];
            mysqlSSHConfig["username"] = remoteDetails.configValues["sshOptions"]["sshUserName"];
            mysqlSSHConfig["password"] = remoteDetails.configValues["sshOptions"]["sshPassword"];
            mysqlSSHConfig["privateKey"] = fs.readFileSync(remoteDetails.configValues["sshOptions"]["sshKeyFile"]);

            return new Promise(function(resolve, reject) {
                sbObjssh.on('ready', function() {
                    sbObjssh.forwardOut(
                        mysqlSSHConfig["sourceAddress"],
                        mysqlSSHConfig["sourcePort"],
                        mysqlSSHConfig["destinationAddress"],
                        mysqlSSHConfig["destinationPort"],
                        function(err, stream) {
                            if (err) {
                                dbConnectStatus = "false";
                                reject(new Error(err.message));
                            } else {
                                mysqlConfig.stream = stream;
                                let connPool = mysql2.createPoolPromise(mysqlConfig);
                                connPool.getConnection()
                                    .then(function(conn) {
                                        let res = conn.query(statement, args);
                                        conn.release();
                                        return res;
                                    }).then(function(result) {
                                        connPool.end();
                                        resolve(result[0]);
                                    }).catch(function(err) {
                                        connPool.end();
                                        reject(err);
                                    });
                            }
                        });
                }).connect({
                    host: mysqlSSHConfig["host"],
                    port: mysqlSSHConfig["port"],
                    username: mysqlSSHConfig["username"],
                    privateKey: mysqlSSHConfig["privateKey"],
                    readyTimeout: mysqlSSHConfig["readyTimeout"],
                    keepaliveInterval: mysqlSSHConfig["keepaliveInterval"],
                    keepaliveCountMax: mysqlSSHConfig["keepaliveCountMax"]

                });
            });
        } else {
            let connection = mysql.createConnection(mysqlConfig);
            connection.connect();
            return new Promise(function(resolve, reject) {
                connection.query(statement, args, function(err, dbResults) {
                    connection.end();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(dbResults);
                    }
                });
            });
        }
    } else {
        return Promise.reject(new Error("Only Insert and Update option are permitted for this function"));
    }
}

YpMysqlObject.prototype.select = function(statement, args) {
    var self = this;
    statement = statement.trim();
    let regExp = new RegExp(/^select\s/, "i");
    if (regExp.test(statement)) {
        let mysqlConfig = {
            host: self.remoteDetails.configValues["hostName"],
            port: self.remoteDetails.configValues["portNumber"],
            user: self.remoteDetails.configValues["userName"],
            password: self.remoteDetails.configValues["password"],
            database: self.remoteDetails.configValues["databaseName"]
        }
        let mysqlSSHConfig = {
            sourceAddress: "",
            sourcePort: "",
            destinationAddress: "",
            destinationPort: "",
            host: "",
            port: "",
            username: "",
            password: "",
            privateKey: "",
            readyTimeout: 10000,
            keepaliveInterval: 1000,
            keepaliveCountMax: 3
        }
        if (self.remoteDetails.configValues["sshOptions"]["enabled"]) {
            var conn = new Client();
            mysqlSSHConfig["sourceAddress"] = "127.0.0.1";
            mysqlSSHConfig["sourcePort"] = 3310;
            mysqlSSHConfig["destinationAddress"] = 'localhost';
            mysqlSSHConfig["destinationPort"] = '3306';
            mysqlSSHConfig["host"] = self.remoteDetails.configValues["sshOptions"]["sshHostName"];
            mysqlSSHConfig["port"] = self.remoteDetails.configValues["sshOptions"]["sshPortNumber"];
            mysqlSSHConfig["username"] = self.remoteDetails.configValues["sshOptions"]["sshUserName"];
            mysqlSSHConfig["password"] = self.remoteDetails.configValues["sshOptions"]["sshPassword"];
            mysqlSSHConfig["privateKey"] = fs.readFileSync('/home/snehil/Documents/folderOne/tripeazzesb.pem');
            conn.on('ready', function() {
                conn.forwardOut('localhost', 3309, '127.0.0.1', 3306, function(err, stream) {
                    if (err) {
                        dbConnectStatus = "false";
                        console.log(new Error(err.message));
                    } else {
                        let mysqlConfig = {
                            host: "localhost",
                            port: 3306,
                            user: "externuser",
                            password: "externpassword01",
                            database: "tripeazzedata",
                            stream: stream
                        }
                        let connPool = mysql2.createPoolPromise(mysqlConfig);
                        connPool.getConnection()
                            .then(function(conn) {
                                let statement = "SELECT * FROM cities;";
                                let args = "";
                                let res = conn.query(statement, args);
                                conn.release();
                                return res;
                            }).then(function(result) {
                                connPool.end();
                                return (result[0]);
                            }).catch(function(err) {
                                connPool.end();
                                return (err);
                            });
                    }
                });
            }).connect(mysqlSSHConfig);
        } else {
            let connection = mysql.createConnection(mysqlConfig);
            connection.connect();
            return new Promise(function(resolve, reject) {
                connection.query(statement, args, function(err, dbResults) {
                    connection.end();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(dbResults);
                    }
                });
            });
        }
    } else {
        return Promise.reject(new Error("Only Select option is permitted for this function"));
    }
}

module.exports = YpMysqlObject