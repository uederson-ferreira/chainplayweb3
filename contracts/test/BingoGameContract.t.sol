// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

// Import only the contract, access enum via ContractName.EnumName
import {BingoGameContract} from "../src/BingoGameContract.sol";
import {CartelaContract} from "../src/CartelaContract.sol";
import {VRFCoordinatorV2Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

/**
 * @title Test BingoGameContract
 * @dev Tests for the BingoGameContract functionalities, including VRF interaction mocks.
 */
contract BingoGameContractTest is Test {
    // Contracts
    BingoGameContract public bingoGame;
    CartelaContract public cartelaContract;
    VRFCoordinatorV2Mock public vrfCoordinatorMock;

    // Users
    address public admin = address(0x1);
    address public player1 = address(0x2);
    address public player2 = address(0x3);

    // VRF Mock Config
    uint64 public subscriptionId;
    bytes32 public keyHash = 0x79d3d8832d964ce69f173fd1a7909ff5b5b39d5f5c5cfc99b4167106e7356b3a; // Example key hash (doesn't matter for mock)
    uint256 public constant FUND_AMOUNT_UINT256 = 10 ether; // Use uint256 for dealing ETH
    uint96 public constant FUND_AMOUNT = 10 ether; // Use uint96 for fundSubscription
    uint32 public constant CALLBACK_GAS_LIMIT = 200000;

    // Game Config
    uint8 public constant DEFAULT_NUMERO_MAXIMO = 75;
    uint8 public constant CARD_LINHAS = 5;
    uint8 public constant CARD_COLUNAS = 5;
    uint256 public constant CARD_SIZE = uint256(CARD_LINHAS) * uint256(CARD_COLUNAS);

    function setUp() public {
        // Deploy CartelaContract
        vm.startPrank(admin);
        cartelaContract = new CartelaContract();

        // Deploy VRFCoordinatorV2Mock
        vrfCoordinatorMock = new VRFCoordinatorV2Mock(0.1 ether, 1e9);

        // Create VRF Subscription
        subscriptionId = vrfCoordinatorMock.createSubscription();

        // Fund Subscription - Cast FUND_AMOUNT_UINT256 to uint96
        vrfCoordinatorMock.fundSubscription(subscriptionId, uint96(FUND_AMOUNT_UINT256));

        // Deploy BingoGameContract
        bingoGame = new BingoGameContract(
            address(cartelaContract),
            address(vrfCoordinatorMock),
            subscriptionId,
            keyHash
        );

        // Add BingoGameContract as a consumer to the subscription
        vrfCoordinatorMock.addConsumer(subscriptionId, address(bingoGame));

        vm.stopPrank();

        // Deal ETH to players for transactions
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
    }

    // --- Helper Functions --- //

    function _createAndRegisterCard(address _player, uint8 _linhas, uint8 _colunas) internal returns (uint256 cartelaId) {
        vm.startPrank(_player);
        cartelaId = cartelaContract.criarCartela(_linhas, _colunas);
        uint[] memory numeros = new uint[](_linhas * _colunas);
        for(uint i = 0; i < numeros.length; i++) {
            numeros[i] = (i % 99) + 1;
        }
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
        vm.stopPrank();
    }

    // --- Test iniciarRodada --- //

    function test_IniciarRodada_Success() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        assertEq(rodadaId, 0, "First round ID should be 0");

        // Access public state variables directly - getter returns tuple of simple types
        (uint256 id, BingoGameContract.EstadoRodada estado, uint8 numeroMaximo, uint256 ultimoRequestId, bool pedidoVrfPendente, bool premiosDistribuidos) = bingoGame.rodadas(rodadaId);
        assertEq(id, rodadaId, "Stored round ID mismatch");
        assertEq(uint(estado), uint(BingoGameContract.EstadoRodada.Aberta), "Round state mismatch");
        assertEq(numeroMaximo, DEFAULT_NUMERO_MAXIMO, "Numero maximo mismatch");
        assertEq(ultimoRequestId, 0, "Last request ID should be 0 initially");
        assertFalse(pedidoVrfPendente, "Pedido VRF pendente should be false initially");
        assertFalse(premiosDistribuidos, "Premios distribuidos should be false initially");
    }

    function test_IniciarRodada_EmitEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BingoGameContract.RodadaIniciada(0, DEFAULT_NUMERO_MAXIMO);
        vm.startPrank(admin);
        bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
    }

    function test_RevertWhen_IniciarRodada_NumeroMaximoTooLow() public {
        vm.startPrank(admin);
        vm.expectRevert("BingoGame: Numero maximo must be between 10 and 99");
        bingoGame.iniciarRodada(9);
        vm.stopPrank();
    }

    function test_RevertWhen_IniciarRodada_NumeroMaximoTooHigh() public {
        vm.startPrank(admin);
        vm.expectRevert("BingoGame: Numero maximo must be between 10 and 99");
        bingoGame.iniciarRodada(100);
        vm.stopPrank();
    }

    // --- Test participar --- //

    function test_Participar_Success() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);

        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();
        // Rely on event emission test for verification
    }

    function test_Participar_EmitEvent() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);

        vm.expectEmit(true, true, true, true);
        emit BingoGameContract.JogadorEntrou(rodadaId, cartelaId, player1);

        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();
    }

    function test_RevertWhen_Participar_RoundNotOpen() public {
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);
        vm.startPrank(player1);
        vm.expectRevert("BingoGame: Round is not open or does not exist");
        bingoGame.participar(0, cartelaId);
        vm.stopPrank();
    }

    function test_RevertWhen_Participar_NotCardOwner() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);

        vm.startPrank(player2);
        vm.expectRevert("BingoGame: Caller is not the owner of the card");
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();
    }

    function test_RevertWhen_Participar_CardNotRegistered() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        vm.startPrank(player1);
        uint256 cartelaId = cartelaContract.criarCartela(CARD_LINHAS, CARD_COLUNAS);
        vm.stopPrank();

        vm.startPrank(player1);
        vm.expectRevert("BingoGame: Card numbers are not registered");
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();
    }

    function test_RevertWhen_Participar_AlreadyParticipating() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);

        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.expectRevert("BingoGame: Card already participating in this round");
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();
    }

    // --- Test sortearNumero & fulfillRandomWords (Basic Mock Interaction) --- //

    function test_SortearNumero_Success_And_Fulfill() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        uint256 cartelaId = _createAndRegisterCard(player1, CARD_LINHAS, CARD_COLUNAS);
        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();

        vm.startPrank(admin);
        uint256 requestId = bingoGame.sortearNumero(rodadaId);
        vm.stopPrank();

        // Check state before fulfillment using public getter
        ( , BingoGameContract.EstadoRodada estadoBefore, , uint256 ultimoRequestIdBefore, bool pedidoPendenteBefore, ) = bingoGame.rodadas(rodadaId);
        assertEq(uint(estadoBefore), uint(BingoGameContract.EstadoRodada.Sorteando), "Round state should be Sorteando");
        assertTrue(pedidoPendenteBefore, "VRF request should be pending");
        assertEq(ultimoRequestIdBefore, requestId, "Last request ID mismatch");

        vm.startPrank(address(vrfCoordinatorMock));
        // Mock fulfill - doesn't need specific random words for this basic check
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(bingoGame));
        vm.stopPrank();

        // Check state after fulfillment using public getter
        ( , , , , bool pedidoPendenteAfter, ) = bingoGame.rodadas(rodadaId);
        assertFalse(pedidoPendenteAfter, "VRF request should not be pending after fulfillment");
        // Rely on event tests for number drawn verification
    }

    function test_SortearNumero_EmitEvent() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();

        vm.expectEmit(true, true, false, true);
        emit BingoGameContract.PedidoVrfEnviado(rodadaId, 1);

        vm.startPrank(admin);
        bingoGame.sortearNumero(rodadaId);
        vm.stopPrank();
    }

    function test_Fulfill_EmitEvent() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        vm.startPrank(admin);
        uint256 requestId = bingoGame.sortearNumero(rodadaId);
        vm.stopPrank();

        // Check only indexed topics (rodadaId, requestId), ignore data (numeroSorteado)
        vm.expectEmit(true, true, false, false);
        emit BingoGameContract.NumeroSorteado(rodadaId, requestId, 0); // Data doesn't matter here

        vm.startPrank(address(vrfCoordinatorMock));
        vrfCoordinatorMock.fulfillRandomWords(requestId, address(bingoGame));
        vm.stopPrank();
    }

    function test_RevertWhen_SortearNumero_RequestPending() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        bingoGame.sortearNumero(rodadaId);
        // Keep admin prank active
        vm.expectRevert("BingoGame: Previous VRF request still pending");
        bingoGame.sortearNumero(rodadaId);
        vm.stopPrank();
    }

    // --- Test _verificarVencedores (Basic Row Win) --- //

    function test_VerificarVencedores_RowWin() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();

        vm.startPrank(player1);
        uint256 cartelaId = cartelaContract.criarCartela(CARD_LINHAS, CARD_COLUNAS);
        uint[] memory numeros = new uint[](CARD_SIZE);
        for(uint i = 0; i < CARD_SIZE; i++) { numeros[i] = i + 1; }
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
        vm.stopPrank();

        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();

        uint256 requestId;
        uint256[] memory randomWords = new uint256[](1);

        for (uint i = 1; i <= 4; i++) {
            vm.startPrank(admin);
            requestId = bingoGame.sortearNumero(rodadaId);
            vm.stopPrank();
            vm.startPrank(address(vrfCoordinatorMock));
            // Pass the desired random word (which maps to the number) as uint256[]
            randomWords[0] = i - 1;
            vrfCoordinatorMock.fulfillRandomWordsWithOverride(requestId, address(bingoGame), randomWords);
            vm.stopPrank();
        }

        vm.startPrank(admin);
        requestId = bingoGame.sortearNumero(rodadaId);
        vm.stopPrank();

        vm.expectEmit(true, true, true, true);
        emit BingoGameContract.VencedorEncontrado(rodadaId, player1, cartelaId);
        vm.expectEmit(true, false, false, true);
        emit BingoGameContract.RodadaFinalizada(rodadaId);

        vm.startPrank(address(vrfCoordinatorMock));
        randomWords[0] = 5 - 1;
        vrfCoordinatorMock.fulfillRandomWordsWithOverride(requestId, address(bingoGame), randomWords);
        vm.stopPrank();

        // Check final state using public getter
        ( , BingoGameContract.EstadoRodada estadoFinal, , , , ) = bingoGame.rodadas(rodadaId);
        assertEq(uint(estadoFinal), uint(BingoGameContract.EstadoRodada.Finalizada), "Round state should be Finalizada");
        // Cannot easily check winners list without getter, rely on event
    }

    // --- Test distribuirPremios (Basic ETH) --- //

    function test_DistribuirPremios_Success_SingleWinner() public {
        // --- Setup win scenario --- //
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        vm.startPrank(player1);
        uint256 cartelaId = cartelaContract.criarCartela(CARD_LINHAS, CARD_COLUNAS);
        uint[] memory numeros = new uint[](CARD_SIZE);
        for(uint i = 0; i < CARD_SIZE; i++) { numeros[i] = i + 1; }
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
        vm.stopPrank();
        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();

        uint256 requestId;
        uint256[] memory randomWords = new uint256[](1);
        for (uint i = 1; i <= 5; i++) {
            vm.startPrank(admin);
            requestId = bingoGame.sortearNumero(rodadaId);
            vm.stopPrank();
            vm.startPrank(address(vrfCoordinatorMock));
            randomWords[0] = i - 1;
            vrfCoordinatorMock.fulfillRandomWordsWithOverride(requestId, address(bingoGame), randomWords);
            vm.stopPrank();
        }
        // --- End Setup --- //

        uint256 prize = 1 ether;
        vm.deal(address(bingoGame), prize);
        assertEq(address(bingoGame).balance, prize, "Contract balance mismatch before distribution");

        uint256 player1BalanceBefore = player1.balance;

        vm.expectEmit(true, false, false, true); // Expect PremioDistribuido event
        emit BingoGameContract.PremioDistribuido(rodadaId, prize, 1);

        // Prank as admin ONLY for the distribute call
        vm.startPrank(admin);
        bingoGame.distribuirPremios(rodadaId);
        vm.stopPrank();

        assertEq(address(bingoGame).balance, 0, "Contract balance should be zero after distribution");
        assertEq(player1.balance, player1BalanceBefore + prize, "Player balance mismatch after distribution");

        // Check flag using public getter
        ( , , , , , bool premiosDistribuidos) = bingoGame.rodadas(rodadaId);
        assertTrue(premiosDistribuidos, "Premios distribuidos flag should be true");
    }

     function test_RevertWhen_DistribuirPremios_RoundNotFinalized() public {
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        // Keep admin prank active
        vm.expectRevert("BingoGame: Round not finalized");
        bingoGame.distribuirPremios(rodadaId);
        vm.stopPrank();
    }

    function test_RevertWhen_DistribuirPremios_AlreadyDistributed() public {
        // --- Setup win scenario & distribute once --- //
        vm.startPrank(admin);
        uint256 rodadaId = bingoGame.iniciarRodada(DEFAULT_NUMERO_MAXIMO);
        vm.stopPrank();
        vm.startPrank(player1);
        uint256 cartelaId = cartelaContract.criarCartela(CARD_LINHAS, CARD_COLUNAS);
        uint[] memory numeros = new uint[](CARD_SIZE);
        for(uint i = 0; i < CARD_SIZE; i++) { numeros[i] = i + 1; }
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
        vm.stopPrank();
        vm.startPrank(player1);
        bingoGame.participar(rodadaId, cartelaId);
        vm.stopPrank();

        uint256 requestId;
        uint256[] memory randomWords = new uint256[](1);
        for (uint i = 1; i <= 5; i++) {
            vm.startPrank(admin);
            requestId = bingoGame.sortearNumero(rodadaId);
            vm.stopPrank();
            vm.startPrank(address(vrfCoordinatorMock));
            randomWords[0] = i - 1;
            vrfCoordinatorMock.fulfillRandomWordsWithOverride(requestId, address(bingoGame), randomWords);
            vm.stopPrank();
        }
        uint256 prize = 1 ether;
        vm.deal(address(bingoGame), prize);
        // Prank as admin ONLY for the first distribute call
        vm.startPrank(admin);
        bingoGame.distribuirPremios(rodadaId);
        vm.stopPrank();
        // --- End Setup --- //

        // Try distributing again
        vm.startPrank(admin);
        vm.expectRevert("BingoGame: Prizes already distributed");
        bingoGame.distribuirPremios(rodadaId);
        vm.stopPrank();
    }

    // TODO: Add more tests

}

