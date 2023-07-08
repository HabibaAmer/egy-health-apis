const router = require('express').Router();

const userRouter = require('./user.js');
const patientRouter = require('./patient.js');

router.use('/user', userRouter);
router.use('/patient', patientRouter);

module.exports = router;