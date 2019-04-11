(async function() {
    const { yprequestFunction, ypresponseFunction } = require('./test/executestub');
    const templateLocation = "globalTemplate";
    const ypMysqlConnector = require(templateLocation + '/yappescli/app/template/yp_mysql_object');
    const yprequest = yprequestFunction();
    const ypresponse = ypresponseFunction();

    logicTemplate

    console.log(ypresponse)
})();