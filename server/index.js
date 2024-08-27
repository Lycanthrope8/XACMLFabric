const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Ensure path is required
const fabricFunctions = require('./lib/app'); // Adjust this path as necessary

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files correctly
app.use(express.static(path.join(__dirname, '../client/public')));

// Correct route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});
// Endpoint for enforcing access control
app.post('/enforce', async (req, res) => {
    try {
        const { subject, action, resource } = req.body;
        const result = await fabricFunctions.enforceAccessControl(subject, action, resource);
        res.send(`Result: ${result}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for evaluating policy
app.post('/evaluate', async (req, res) => {
    try {
        const result = await fabricFunctions.evaluatePolicy(req.body);
        res.send(`Evaluation Result: ${result}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for setting role
app.post('/setRole', async (req, res) => {
    try {
        const { username, roles } = req.body;
        await fabricFunctions.setRole(username, roles);
        res.send(`Role set successfully for ${username}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for getting role
app.post('/getRole', async (req, res) => {
    try {
        const result = await fabricFunctions.getRole(req.body.username);
        res.send(`Role Data: ${result}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for adding policy
app.post('/addPolicy', async (req, res) => {
    try {
        const { policyId, policyXml } = req.body;
        await fabricFunctions.addPolicy(policyId, policyXml);
        res.send(`Policy added successfully with ID: ${policyId}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for getting a single policy
app.post('/getPolicy', async (req, res) => {
    try {
        const result = await fabricFunctions.getPolicy(req.body.policyId);
        res.send(`Policy Data: ${result}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

// Endpoint for getting all policies
app.get('/getAllPolicies', async (req, res) => {
    try {
        const result = await fabricFunctions.getAllPolicies();
        res.send(`All Policies: ${result}`);
    } catch (error) {
        res.status(500).send("Error processing request: " + error.message);
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
