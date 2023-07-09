const network = require('../fabric/network.js');
const apiResponse = require('../utils/apiResponse.js');
const authenticateUtil = require('../utils/authenticate.js');


exports.signup = async (isHospital, isLab, information) => {
    const { id, userRole, name, email, password } = information;

    let networkObj;
    networkObj = await network.connect(isHospital, isLab, "admin2");
    
    let contractRes;
    contractRes = await network.invoke(networkObj, 'createUser', name, email, userRole, password);
    console.log('5');
    console.log(contractRes);
    const walletRes = await network.registerUser(isHospital, isLab, contractRes.UserID);

    const error = walletRes.error || networkObj.error || contractRes.error;
    if (error) {
        const status = walletRes.status || networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }

    delete contractRes.Password;
    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.signin = async (isHospital, isLab, information) => {
    const { id, password } = information;

    const networkObj = await network.connect(isHospital, isLab, id);
    let contractRes;
    contractRes = await network.invoke(networkObj, 'signIn', id, password);
    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    console.log(contractRes);
    const { Name, UserRole } = contractRes;
    delete contractRes.Password;
    const accessToken = authenticateUtil.generateAccessToken({ id, UserRole, Name });
    return apiResponse.createModelRes(200, 'Success', { ...contractRes, accessToken });
};

// exports.getAllUser = async (isHospital, isLab, information) => {
//     const { id } = information;

//     const networkObj = await network.connect(true, false, 'admin');

//     const contractRes = await network.invoke(networkObj, 'queryAll', 'User');

//     const error = networkObj.error || contractRes.error;
//     if (error) {
//         const status = networkObj.status || contractRes.status;
//         return apiResponse.createModelRes(status, error);
//     }

//     return apiResponse.createModelRes(200, 'Success', contractRes);
// };