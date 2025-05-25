// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CartelaContract.sol";
import "../src/BingoGameContract.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy do contrato Cartela
        CartelaContract cartela = new CartelaContract(
            0.01 ether, // precoBaseCartela
            deployer    // feeCollector
        );
        console.log("Cartela deployed to:", address(cartela));
        
        console.log("msg.sender:", msg.sender);
        console.log("deployer:", deployer);
        console.log("admin:", cartela.admin());
        console.log("feeCollector:", cartela.feeCollector());

        // Deploy do contrato BingoGame
        // Para ambiente local, usamos endereços mock
        BingoGameContract bingoGame = new BingoGameContract(
            address(cartela),     // cartelaContract
            address(0),           // vrfCoordinator (mock)
            1,                    // subscriptionId (mock)
            bytes32(0),           // keyHash (mock)
            deployer,             // admin
            deployer              // feeCollector
        );
        console.log("BingoGame deployed to:", address(bingoGame));

        // A chamada setBingoGameContract NÃO deve estar aqui. Será feita separadamente por um endereço autorizado.
        // cartela.setBingoGameContract(address(bingoGame));
        // console.log("BingoGame set as game contract in Cartela");

        vm.stopBroadcast();
    }
} 