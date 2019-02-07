exports.normalize = function(inputData) {
    // if (inputData.includes("_")) {
    //     inputData = inputData.split("_").join(" ");
    //     return inputData;
    // }
     if (inputData.includes(" ")) {
        inputData = inputData.split(" ").join("_");
        return inputData;
    } else {
        return inputData;
    }
}