const patientRouter = require('express').Router();
const controller = require('../controllers/patient.js');

patientRouter.post('/createPatient', controller.createPatient);
// patientRouter.get('/all/:role', controller.getAllUser);
// patientRouter.post('/signin/:role', controller.signin);

module.exports = patientRouter;