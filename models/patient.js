const network = require('../fabric/network.js');
const apiResponse = require('../utils/apiResponse.js');


exports.createPatient = async (data) => {
    const { patientId, name, age, gender, bloodType, allergies, access, diagnose, medication, diagnoseHistory, medicationHistory } = data;
    
    let networkObj;
    networkObj = await network.connect(true, false, patientId);
    
    let contractRes;
    contractRes = await network.invoke(networkObj, 'createPatient', patientId, name, age, gender, bloodType, allergies, access, diagnose, medication, diagnoseHistory, medicationHistory);
    console.log('5');

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    
    return apiResponse.createModelRes(200, 'Success', contractRes);
};
