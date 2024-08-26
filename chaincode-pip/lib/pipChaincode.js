'use strict';

const { Contract } = require('fabric-contract-api');

class PIPChaincode extends Contract {

    async initLedger(ctx) {
        console.log('Initializing the PIP ledger with initial user roles');
        const initialUsers = [
            {
                username: 'john.doe',
                role: ['admin', 'user']
            },
            {
                username: 'jane.doe',
                role: ['user']
            }
        ];

        for (const user of initialUsers) {
            const attributesKey = `attribute_${user.username}`;
            const roleData = { role: user.role };
            await ctx.stub.putState(attributesKey, Buffer.from(JSON.stringify(roleData)));
            console.log(`Role data for ${user.username} set`);
        }
    }

    async setRole(ctx, username, roles) {
        console.log(`Setting role for ${username}`);
        const attributesKey = `attribute_${username}`;
        const existingData = await ctx.stub.getState(attributesKey);

        let roleData;
        if (!existingData || existingData.length === 0) {
            roleData = { role: roles };
        } else {
            roleData = JSON.parse(existingData.toString());
            roleData.role = roles;
        }

        await ctx.stub.putState(attributesKey, Buffer.from(JSON.stringify(roleData)));
        console.log(`Role updated for ${username}`);
    }

    async getRole(ctx, username) {
        console.log(`Getting role for ${username}`);
        const attributesKey = `attribute_${username}`;
        const roleData = await ctx.stub.getState(attributesKey);

        if (!roleData || roleData.length === 0) {
            return '{}';  // Return an empty object in string format if no roles are found
        }
        return roleData.toString();
    }
}

module.exports = PIPChaincode;
