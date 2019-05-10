const { configs } = require('../configs/yp_configs');
const ypRequest = require('../utils/yp_request');

const processingData = {
  endPointPath: '/cli/api/definitions',
};
const data = {};

ypRequest.call(processingData.endPointPath, 'get', data, (err, apiResponse) => {
  if (err) {
    console.log(err);
  } else {
    console.log(apiResponse);
  }
});
