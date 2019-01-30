const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');

let processingData = {
    endPointPath: "/cli/api/definitions"
};
let data = {};

ypRequest.call(processingData.endPointPath, "get", data, function(err, apiResponse) {
    if (err) {
        console.log(err);
    } else {
        console.log(apiResponse);
    }
});