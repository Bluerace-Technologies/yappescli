/* eslint-disable */

(async function () {
  const { yprequestFunction, ypresponseFunction } = require('./test/executestub');
  const templateLocation = 'globalTemplate';
  const ypMysqlConnector = require(`${templateLocation}/yappescli/app/template/yp_mysql_object`);
  const ypMongoConnector = require(`${templateLocation}/yappescli/app/template/yp_mongo_object`);
  const ypStoreConnector = require(`${templateLocation}/yappescli/app/template/yp_store_object`);
  const ypWebserviceConnector = require(`${templateLocation}/yappescli/app/template/yp_httpws_object`);
  const yprequest = yprequestFunction();
  const ypresponse = ypresponseFunction();
  try {
    logicTemplate;
    console.log(ypresponse);
  } catch (error) {
    console.log(error);
  }
}());
