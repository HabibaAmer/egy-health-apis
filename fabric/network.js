const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

const hospitalCcpPath = path.join(process.cwd(), process.env.HOSPITAL_CONN);
const hospitalCcpFile = fs.readFileSync(hospitalCcpPath, 'utf8');
const hospitalCcp = JSON.parse(hospitalCcpFile);

const labCcpPath = path.join(process.cwd(), process.env.LAB_CONN);
const labCcpFile = fs.readFileSync(labCcpPath, 'utf8');
const labCcp = JSON.parse(labCcpFile);


function getConnectionMaterial(isHospital, isLab) {
    const connectionMaterial = {};

    if (isHospital) {
        connectionMaterial.walletPath = path.join(process.cwd(), process.env.HOSPITAL_WALLET);
        connectionMaterial.connection = hospitalCcp;
        connectionMaterial.orgMSPID = process.env.HOSPITAL_MSP;
        connectionMaterial.caURL = process.env.HOSPITAL_CA_ADDR;
    }

    if (isLab) {
        connectionMaterial.walletPath = path.join(process.cwd(), process.env.LAB_WALLET);
        connectionMaterial.connection = labCcp;
        connectionMaterial.orgMSPID = process.env.LAB_MSP;
        connectionMaterial.caURL = process.env.LAB_CA_ADDR;
    }

    return connectionMaterial;
}

exports.connect = async (isHospital, isLab, userID) => {
    const gateway = new Gateway();

    try {
        const { walletPath, connection } = getConnectionMaterial(isHospital, isLab);

        const wallet = new FileSystemWallet(walletPath);
        const userExists = await wallet.exists(userID);
        if (!userExists) {
            console.error(`An identity for the user ${userID} does not exist in the wallet. Register ${userID} first`);
            return { status: 401, error: 'User identity does not exist in the wallet.' };
        }

        await gateway.connect(connection, {
            wallet,
            // identity: userID,
            identity: "admin2",
            discovery: { enabled: true, asLocalhost: Boolean(process.env.AS_LOCALHOST) },
        });
        const network = await gateway.getNetwork(process.env.CHANNEL);
        const contract = await network.getContract(process.env.CONTRACT);
        console.log('Connected to fabric network successfully.');

        const networkObj = { gateway, network, contract };

        return networkObj;
    } catch (err) {
        console.error(`Fail to connect network: ${err}`);
        await gateway.disconnect();
        return { status: 500, error: err.toString() };
    }
};

exports.query = async (networkObj, ...funcAndArgs) => {
    try {
        console.log(`Query parameter: ${funcAndArgs}`);
        const funcAndArgsStrings = funcAndArgs.map(elem => String(elem));
        const response = await networkObj.contract.evaluateTransaction(...funcAndArgsStrings);
        console.log(`Transaction ${funcAndArgs} has been evaluated: ${response}`);

        return JSON.parse(response);
    } catch (err) {
        console.error(`Failed to evaluate transaction: ${err}`);
        return { status: 500, error: err.toString() };
    } finally {
        if (networkObj.gatway) {
            await networkObj.gateway.disconnect();
        }
    }
};

exports.invoke = async (networkObj, ...funcAndArgs) => {
    try {
        console.log(`Invoke parameter: ${funcAndArgs}`);
        const funcAndArgsStrings = funcAndArgs.map(elem => String(elem));
        console.log(funcAndArgsStrings);
        const response = await networkObj.contract.submitTransaction(...funcAndArgsStrings);
        console.log(response);
        console.log(`Transaction ${funcAndArgs} has been submitted: ${response}`);

        return JSON.parse(response);
    } catch (err) {
        console.error(`Failed to submit transaction: ${err}`);
        return { status: 500, error: err.toString() };
    } finally {
        if (networkObj.gatway) {
            await networkObj.gateway.disconnect();
        }
    }
};

exports.enrollAdmin = async (isHospital, isLab) => {
    try {
        const { walletPath, orgMSPID, caURL } = getConnectionMaterial(isHospital, isLab);

        const wallet = new FileSystemWallet(walletPath);
        const adminExists = await wallet.exists(process.env.ADMIN);
        if (adminExists) {
            console.error('Admin user identity already exists in the wallet');
            return;
        }

        const ca = new FabricCAServices(caURL);
        const enrollment = await ca.enroll({
            enrollmentID: process.env.ADMIN,
            enrollmentSecret: process.env.ADMIN_SECRET,
        });
        const identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(process.env.ADMIN, identity);
        console.log(`Successfully enrolled admin user and imported it into the wallet`);
    } catch (err) {
        console.error(`Failed to enroll admin user: ${err}`);
        process.exit(1);
    }
};

exports.loadAdmin = async (isHospital, isLab) => {
    const { walletPath, orgMSPID } = getConnectionMaterial(isHospital, isLab);
    try {
        var certPath = isHospital ? process.env.HOSPITAL_ADMIN_CERT_PATH : process.env.LAB_ADMIN_CERT_PATH
        var cert = fs.readFileSync(certPath).toString();
        var keyPath = isHospital ? process.env.HOSPITAL_ADMIN_KEY_PATH : process.env.LAB_ADMIN_KEY_PATH
        var key = fs.readFileSync(keyPath).toString();

    } catch (e) {
        console.log("Error reading certificate or key!!! ")
        process.exit(1)
    }

    const wallet = new FileSystemWallet(walletPath);
    const identity = X509WalletMixin.createIdentity(orgMSPID, cert, key);
    await wallet.import("admin2", identity);


    console.log(`Successfully loaded admin user and imported it into the wallet`);

};

exports.registerUser = async (isHospital, isLab, userID) => {
    const gateway = new Gateway();

    try {
        const { walletPath, connection, orgMSPID } = getConnectionMaterial(isHospital, isLab);

        console.log(walletPath);
        console.log(orgMSPID);

        const wallet = new FileSystemWallet(walletPath);
        const userExists = await wallet.exists(userID);
        if (userExists) {
            console.error(`An identity for the user ${userID} already exists in the wallet`);
            return { status: 400, error: 'User identity already exists in the wallet.' };
        }

        await gateway.connect(connection, {
            wallet,
            identity: process.env.ADMIN,
            discovery: { enabled: true, asLocalhost: Boolean(process.env.AS_LOCALHOST) },
        });
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        const secret = await ca.register({ enrollmentID: userID, role: 'client' }, adminIdentity);
        console.log('ca registered')
        const enrollment = await ca.enroll({ enrollmentID: userID, enrollmentSecret: secret });
        console.log('ca enrolled')
        const userIdentity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
        console.log('user identity created')
        await wallet.import(userID, userIdentity);

        console.log(`Successfully registered user. Use userID ${userID} to login`);
        return userIdentity;
    } catch (err) {
        console.error(`Failed to register user ${userID}: ${err}`);
        return { status: 500, error: err.toString() };
    } finally {
        await gateway.disconnect();
    }
};

exports.checkUserExists = async (isHospital, isLab, userID) => {
    try {
        const { walletPath } = getConnectionMaterial(isHospital, isLab);
        const wallet = new FileSystemWallet(walletPath);
        const userExists = await wallet.exists(userID);
        return userExists;
    } catch (err) {
        console.error(`Failed to check user exists ${userID}: ${err}`);
        return { status: 500, error: err.toString() };
    }
};