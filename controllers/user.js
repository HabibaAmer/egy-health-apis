const authModel = require('../models/user.js');
const apiResponse = require('../utils/apiResponse.js');

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    const { role } = req.params;

    console.log(req.body);
    console.log(role);

    if ((!name || !email || !role || !password)) {
        console.log('1');
        return apiResponse.badRequest(res);
    }

    let modelRes = await authModel.signup(true, false, { userRole: role, name, email, password });


    return apiResponse.send(res, modelRes);
};

exports.signin = async (req, res) => {
    const { id, password } = req.body;
    const { role } = req.params;
    if (!id || !password || !role) {
        return apiResponse.badRequest(res);
    }

    let modelRes = await authModel.signin(true, false, { id, password });

    return apiResponse.send(res, modelRes);
};


exports.getAllUser = async (req, res) => {
    const { id } = req.body;
    const { role } = req.params;

    let modelRes;
    if (role === 'manufacturer') {
        modelRes = await authModel.getAllUser(true, false, false, { id });
    } else if (role === 'middlemen') {
        modelRes = await authModel.getAllUser(false, true, false, { id });
    } else if (role === 'consumer') {
        modelRes = await authModel.getAllUser(false, false, true, { id });
    } else {
        return apiResponse.badRequest(res);
    }
    return apiResponse.send(res, modelRes);
};