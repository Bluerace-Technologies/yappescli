exports.normalize = function(inputData) {
     if (inputData.includes(" ")) {
        inputData = inputData.split(" ").join("_");
        return inputData;
    } else {
        return inputData;
    }
}

exports.denormalize = function(inputData, setFile){
	let regex = /_/gi;
	let denormString = "";
	let matchFound = false;
	let denormList = [];
	for (let lcount=0; lcount<inputData.length; lcount++){
		matchFound = false;
		denormString = inputData[lcount].replace(regex,' ');
		for(let scount=0; scount<setFile.apiReferences.length && !matchFound; scount++){
			if(setFile.apiReferences[scount].apiName == denormString){
				matchFound = true;
				denormList.push(denormString);
			}
		}
	}
	return denormList;
}