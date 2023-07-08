const model = require('../models/patient.js');
const apiResponse = require('../utils/apiResponse.js');

// const data = {
//     patientId: 'Patient1',
//     name: 'test8',
//     age: 6,
//     gender: 'female',
//     bloodType: 'O-',
//     allergies: 'xy',
//     access: {'Doctor1': true},
//     diagnose: 'diag8',
//     medication: 'med8',
//     diagnoseHistory: ['diagHist1', 'diagHistory2'],
//     medicationhistory: ['medHist1', 'medHistory2'],
// }


exports.createPatient = async (req, res) => {
    const { patientId, name, age, gender, bloodType, allergies, access, diagnose, medication, diagnoseHistory, medicationHistory } = req.body;

    console.log(req.body);

    if ((!patientId || !name || !age || !gender || !bloodType || !allergies || !access || !diagnose || !medication || !diagnoseHistory || !medicationHistory)) {
        console.log('1');
        return apiResponse.badRequest(res);
    }

    let modelRes = await model.createPatient(req.body);

    return apiResponse.send(res, modelRes);
};
