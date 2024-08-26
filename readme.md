

# XACML Access Control System on Hyperledger Fabric

This project implements an access control system based on the eXtensible Access Control Markup Language (XACML) model, deployed on Hyperledger Fabric. It features four main chaincodes: PAP (Policy Administration Point), PDP (Policy Decision Point), PEP (Policy Enforcement Point), and PIP (Policy Information Point), which collectively manage access control decisions and enforce policies across the network.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:
- Docker and Docker Compose
- Hyperledger Fabric binaries and Docker images
- Node.js (for running JavaScript chaincodes)

### Installation

1. **Clone the repository:**

```bash
git clone [repository-url]
cd [repository-folder]
```

2. **Start the Hyperledger Fabric network:**

```bash
./network.sh down    # Stop any previous network
./network.sh up createChannel  # Start network and create channel
```

3. **Deploy the chaincodes:**

```bash
./network.sh deployCC -ccn chaincodePAP -ccp ../XACML/chaincode-pap -ccl javascript
./network.sh deployCC -ccn chaincodePDP -ccp ../XACML/chaincode-pdp -ccl javascript
./network.sh deployCC -ccn chaincodePEP -ccp ../XACML/chaincode-pep -ccl javascript
./network.sh deployCC -ccn chaincodePIP -ccp ../XACML/chaincode-pip -ccl javascript
```

### Setting up the environment

Set the PATH and environment variables:

```bash
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
```

Configure the environment for Org1:

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

### Initializing Ledgers

Initialize the ledger for each chaincode:

```bash
# Initialize chaincodePAP ledger
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n chaincodePAP --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"initLedger","Args":[]}'

# Initialize chaincodePIP ledger
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n chaincodePIP --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"initLedger","Args":[]}'
```

### Testing

Test the functionality of the deployed chaincodes by invoking chaincodePEP:

```bash
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n chaincodePEP --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"enforce","Args":["john.doe","write","adminPanel"]}'
```

## Authors

- **Jubayer Hossain** - *Initial work* - [lycanthrope8](https://github.com/Lycanthrope8)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration
- etc

---

Feel free to customize this template to better suit your project's specifics!