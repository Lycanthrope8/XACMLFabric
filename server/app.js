const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { TextDecoder } = require('util');

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        __dirname,
        '..',
        '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
);

// Path to user private key directory.
const keyDirectoryPath = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore'
    )
);

// Path to user certificate directory.
const certDirectoryPath = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts'
    )
);

// Path to peer tls certificate.
const tlsCertPath = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
);

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();


async function main() {
    displayInputParameters();
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
        endorseOptions: () => ({ deadline: Date.now() + 15000 }),
        submitOptions: () => ({ deadline: Date.now() + 5000 }),
        commitStatusOptions: () => ({ deadline: Date.now() + 60000 })
    });

    try {
        const pepContract = await getContractInstance(gateway, channelName, 'chaincodePEP');
        await enforceAccessControl(pepContract, 'alice.smith', 'read', 'salaryPanel');

        const pdpContract = await getContractInstance(gateway, channelName, 'chaincodePDP');
        const policyResult = await evaluatePolicy(pdpContract, { subject: 'alice.smith', action: 'read', resource: 'salaryPanel' });

        const pipContract = await getContractInstance(gateway, channelName, 'chaincodePIP');
        await setRole(pipContract, 'abc', 'teacher');
        const roleData = await getRole(pipContract, 'abc');

        const papContract = await getContractInstance(gateway, channelName, 'chaincodePAP');
        await addPolicy(papContract, 'newPolicyId', "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Policy xmlns=\"urn:oasis:names:tc:xacml:3.0:core:schema:wd-17\"\n        PolicyId=\"AdminWriteAccessPolicy\"\n        RuleCombiningAlgId=\"urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable\"\n        Version=\"1.0\">\n    <Description>\n        Policy to grant write access to the admin panel for users with the admin role.\n    </Description>\n    <Target>\n        <!-- Define the applicable resource and action -->\n        <Resources>\n            <Resource>\n                <ResourceMatch MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">userPanel</AttributeValue>\n                    <ResourceAttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:resource:resource-id\"\n                                                 DataType=\"http://www.w3.org/2001/XMLSchema#string\"/>\n                </ResourceMatch>\n            </Resource>\n        </Resources>\n        <Actions>\n            <Action>\n                <ActionMatch MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">read</AttributeValue>\n                    <ActionAttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\"\n                                               DataType=\"http://www.w3.org/2001/XMLSchema#string\"/>\n                </ActionMatch>\n            </Action>\n        </Actions>\n    </Target>\n    <Rule RuleId=\"GrantWriteToAdmin\"\n          Effect=\"Permit\">\n        <Description>\n            Grant write access if the user has the admin role.\n        </Description>\n        <Target>\n            <Subjects>\n                <Subject>\n                    <SubjectMatch MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n                        <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">user</AttributeValue>\n                        <SubjectAttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:subject:subject-role-id\"\n                                                    DataType=\"http://www.w3.org/2001/XMLSchema#string\"/>\n                    </SubjectMatch>\n                </Subject>\n            </Subjects>\n        </Target>\n    </Rule>\n    <!-- Default Deny Rule -->\n    <Rule RuleId=\"DefaultDeny\"\n          Effect=\"Deny\"/>\n</Policy>");
        const policy = await getPolicy(papContract, 'newPolicyId');
        const allPolicies = await getAllPolicies(papContract);

    } finally {
        gateway.close();
        client.close();
    }
}

main().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getContractInstance(gateway, channelName, chaincodeName) {
    const network = await gateway.getNetwork(channelName);
    return network.getContract(chaincodeName);
}

async function enforceAccessControl(contract, subject, action, resource) {
    console.log(`\n--> Submit Transaction: Enforce, checks access for subject=${subject}, action=${action}, resource=${resource}`);
    const result = await contract.submitTransaction('enforce', subject, action, resource);
    const resultString = utf8Decoder.decode(result);
    console.log(`*** Decision: ${resultString}`);
}

async function evaluatePolicy(contract, request) {
    console.log(`Evaluating policy with request: ${JSON.stringify(request)}`);
    const result = await contract.evaluateTransaction('evaluate', JSON.stringify(request));
    const readableResult = utf8Decoder.decode(result); // Decoding buffer to string
    console.log(`Policy evaluation result: ${readableResult}`);
    return readableResult;
}


async function setRole(contract, username, roles) {
    console.log(`Setting roles for ${username}`);
    await contract.submitTransaction('setRole', username, roles);
    console.log(`Roles set for ${username}`);
}

async function getRole(contract, username) {
    console.log(`Fetching role for ${username}`);
    const result = await contract.evaluateTransaction('getRole', username);
    const readableResult = utf8Decoder.decode(result); // Decoding buffer to string
    console.log(`Role data for ${username}: ${readableResult}`);
    return readableResult;
}


async function addPolicy(contract, policyId, policyXml) {
    console.log(`Adding policy with ID: ${policyId}`);
    await contract.submitTransaction('addPolicy', policyId, policyXml);
    console.log(`Policy ${policyId} added successfully.`);
}

async function getPolicy(contract, policyId) {
    console.log(`Fetching policy with ID: ${policyId}`);
    const result = await contract.evaluateTransaction('getPolicy', policyId);
    const readableResult = utf8Decoder.decode(result); // Decoding buffer to string
    console.log(`Policy data: ${readableResult}`);
    return readableResult;
}


async function getAllPolicies(contract) {
    console.log(`Fetching all policies`);
    const result = await contract.evaluateTransaction('getAllPolicies');
    const readableResult = utf8Decoder.decode(result); // Decoding buffer to string
    console.log(`All Policies: ${readableResult}`);
    return readableResult;
}


function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

function displayInputParameters() {
    console.log(`Channel Name:       ${channelName}`);
    console.log(`MSP ID:             ${mspId}`);
    console.log(`Crypto Path:        ${cryptoPath}`);
    console.log(`Key Directory Path: ${keyDirectoryPath}`);
    console.log(`Cert Directory Path: ${certDirectoryPath}`);
    console.log(`TLS Cert Path:       ${tlsCertPath}`);
    console.log(`Peer Endpoint:      ${peerEndpoint}`);
    console.log(`Peer Host Alias:     ${peerHostAlias}`);
}
