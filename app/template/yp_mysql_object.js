let mysql = require("mysql");

function YpMysqlObject(remoteEndPoint) {
    this.remoteEndPoint = remoteEndPoint;
    this.ypContext = JSON.parse(process.env.ypcontext);
    this.remoteDetails = {};
    this.ypContext.ypsettings.forEach(function(config) {
        
        if (config.configValues.remoteName == remoteEndPoint) {
            this.remoteDetails = config;
        }
    });
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

    if (regExp.test(statement)) {
        let mysqlConfig = {
            host: remoteDetails.configValues["hostName"],
            port: remoteDetails.configValues["portNumber"],
            user: remoteDetails.configValues["userName"],
            password: remoteDetails.configValues["password"],
            database: remoteDetails.configValues["databaseName"]
        }
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
    } else {
        return Promise.reject(new Error("Only Insert and Update option are permitted for this function"));
    }
}


YpMysqlObject.prototype.queryWithMysqlPromises = function(mysqlObj, statement) {
    var self = this;

    return mysqlObj.query(statement)
        .then(function(rows) {
            self.remoteResponse.result = rows[0];
            return mysqlObj.close();
        })
        .then(function() {
            return self.remoteResponse;
        });
}

YpMysqlObject.prototype.select = function(statement, args) {
    var self = this;
    statement = statement.trim();
    let regExp = new RegExp(/^select\s/, "i");
    if (regExp.test(statement)) {
        let mysqlConfig = {
            host: remoteDetails.configValues["hostName"],
            port: remoteDetails.configValues["portNumber"],
            user: remoteDetails.configValues["userName"],
            password: remoteDetails.configValues["password"],
            database: remoteDetails.configValues["databaseName"]
        }
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
    } else {
        return Promise.reject(new Error("Only Select option is permitted for this function"));
    }
}

module.exports = YpMysqlObject