// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CartelaContract.sol";
import "../src/BingoGameContract.sol";

contract DeployBingo is Script {
    // Configurações VRF para Anvil (fork mainnet)
    address constant VRF_COORDINATOR = 0x271682DEB8C4E0901D1a1550aD2e64D568E69909;
    bytes32 constant KEY_HASH = 0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef;
    uint64 constant SUBSCRIPTION_ID = 0; // Será atualizado depois
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts...");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy CartelaContract
        console.log("\n Deploying CartelaContract...");
        uint256 precoBase = 0.01 ether;
        
        CartelaContract cartelaContract = new CartelaContract(
            precoBase,
            deployer // feeCollector
        );
        
        console.log("CartelaContract deployed at:", address(cartelaContract));
        
        // 2. Deploy BingoGameContract
        console.log("\n Deploying BingoGameContract...");
        
        BingoGameContract bingoContract = new BingoGameContract(
            address(cartelaContract),  // _cartelaContractAddress
            VRF_COORDINATOR,           // _vrfCoordinator
            SUBSCRIPTION_ID,           // _subscriptionId
            KEY_HASH,                  // _keyHash
            deployer,                  // _admin
            deployer                   // _feeCollector
        );
        
        console.log("BingoGameContract deployed at:", address(bingoContract));
        
        // 3. Configure contracts
        console.log("\n Configuring contracts...");
        cartelaContract.setBingoGameContract(address(bingoContract));
        bingoContract.setOperador(deployer, true);
        console.log("Contracts configured");
        
        vm.stopBroadcast();
        
        // 4. Log final addresses
        console.log("\n DEPLOYMENT SUMMARY:");
        console.log("==========================================");
        console.log("CartelaContract  :", address(cartelaContract));
        console.log("BingoGameContract:", address(bingoContract));
        console.log("Price per Card   :", precoBase / 1e18, "ETH");
        console.log("Admin/FeeCollector:", deployer);
        console.log("VRF Coordinator  :", VRF_COORDINATOR);
        console.log("Subscription ID  :", SUBSCRIPTION_ID);
        console.log("==========================================");
        
        console.log("\n UPDATE YOUR .env:");
        console.log("NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=", address(cartelaContract));
        console.log("NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=", address(bingoContract));
        
        // 5. Save deployment data to file
        string memory deploymentData = string(abi.encodePacked(
            '{\n',
            '  "cartelaContract": "', vm.toString(address(cartelaContract)), '",\n',
            '  "bingoContract": "', vm.toString(address(bingoContract)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "timestamp": "', vm.toString(block.timestamp), '",\n',
            '  "network": "localhost-fork"\n',
            '}'
        ));
        
        vm.writeFile("../frontendv2/scripts/deployment.json", deploymentData);
        console.log("Deployment data saved to frontendv2/scripts/deployment.json");
    }
}