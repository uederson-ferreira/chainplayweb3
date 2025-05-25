// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CartelaContract} from "../src/CartelaContract.sol";

/**
 * @title Test CartelaContract
 * @dev Basic tests for the CartelaContract functionalities.
 */
contract CartelaContractTest is Test {
    CartelaContract public cartelaContract;
    address public admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Anvil Account 0
    address public user1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil Account 1
    address public user2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil Account 2

    uint8 public constant DEFAULT_LINHAS = 5;
    uint8 public constant DEFAULT_COLUNAS = 5;
    uint256 public constant DEFAULT_PRECO = 0.01 ether;
    uint constant CARD_SIZE = uint(DEFAULT_LINHAS) * uint(DEFAULT_COLUNAS);

    function setUp() public {
        vm.startPrank(admin);
        cartelaContract = new CartelaContract(DEFAULT_PRECO, admin);
        vm.stopPrank();
    }

    function _createDefaultNumbers() internal pure returns (uint[] memory) {
        uint[] memory numeros = new uint[](CARD_SIZE);
        for (uint i = 0; i < CARD_SIZE; i++) {
            numeros[i] = i + 1; // Simple sequential numbers 1-25
        }
        return numeros;
    }

    // --- Test criarCartela --- //

    function test_CriarCartela_Success() public {
        vm.startPrank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        vm.stopPrank();

        (uint256 id, uint8 linhas, uint8 colunas, address dono, bool numerosRegistrados, bool emUso, uint256 precoBase) = cartelaContract.cartelas(cartelaId);
        assertEq(id, cartelaId, "Cartela ID mismatch");
        assertEq(linhas, DEFAULT_LINHAS, "Linhas mismatch");
        assertEq(colunas, DEFAULT_COLUNAS, "Colunas mismatch");
        assertEq(dono, user1, "Dono mismatch");
        assertFalse(numerosRegistrados, "Numeros should not be registered");
        assertFalse(emUso, "Cartela should not be in use");
        assertEq(precoBase, DEFAULT_PRECO, "Preco base mismatch");
    }

    function test_CriarCartela_EmitEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CartelaContract.CartelaCriada(0, user1, DEFAULT_LINHAS, DEFAULT_COLUNAS, DEFAULT_PRECO);
        vm.prank(user1);
        cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
    }

    function test_RevertWhen_CriarCartela_ZeroLinhas() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Linhas devem ser maiores que 0");
        cartelaContract.criarCartela{value: DEFAULT_PRECO}(0, DEFAULT_COLUNAS);
    }

    function test_RevertWhen_CriarCartela_ZeroColunas() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Colunas devem ser maiores que 0");
        cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, 0);
    }

    function test_RevertWhen_CriarCartela_TooLarge() public {
        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Tamanho da cartela muito grande (máx 255 células)");
        cartelaContract.criarCartela{value: DEFAULT_PRECO}(16, 16); // 16*16 = 256 > 255 limit
    }

    // --- Test registrarNumerosCartela --- //

    function test_RegistrarNumeros_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numerosToRegister = _createDefaultNumbers();

        vm.prank(user1); // Must be owner
        cartelaContract.registrarNumerosCartela(cartelaId, numerosToRegister);

        (, , , , bool numerosRegistrados, bool emUso, ) = cartelaContract.cartelas(cartelaId);
        assertTrue(numerosRegistrados, "Numeros should be registered");
        assertFalse(emUso, "Cartela should not be in use");

        uint[] memory registeredNumeros = cartelaContract.getNumerosCartela(cartelaId);
        assertEq(registeredNumeros.length, CARD_SIZE, "Numeros array length mismatch");
        assertEq(registeredNumeros[0], 1, "First number mismatch");
        assertEq(registeredNumeros[CARD_SIZE - 1], CARD_SIZE, "Last number mismatch");
    }

    function test_RegistrarNumeros_EmitEvent() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.expectEmit(true, false, false, true);
        emit CartelaContract.NumerosCartelaRegistrados(cartelaId, numeros);

        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_NotOwner() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.prank(user2); // Different user tries to register
        vm.expectRevert(unicode"CartelaContract: Chamador não é o dono");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_AlreadyRegistered() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);

        // Try registering again
        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Números já registrados");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_IncorrectLength() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = new uint[](CARD_SIZE - 1); // Incorrect size
        for(uint i = 0; i < numeros.length; i++) { numeros[i] = i+1; }

        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Número incorreto de elementos");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_NumberOutOfRangeZero() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();
        numeros[0] = 0; // Invalid number

        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Número fora do intervalo (1-99)");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_NumberOutOfRangeHigh() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();
        numeros[0] = 100; // Invalid number (>= 100)

        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Número fora do intervalo (1-99)");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    // --- Test vincularDono --- //

    function test_VincularDono_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user1); // Current owner transfers
        cartelaContract.vincularDono(cartelaId, user2);

        (, , , address dono, , , ) = cartelaContract.cartelas(cartelaId);
        assertEq(dono, user2, "New owner mismatch");
    }

    function test_VincularDono_EmitEvent() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.expectEmit(true, true, true, false);
        emit CartelaContract.DonoCartelaTransferido(cartelaId, user1, user2);

        vm.prank(user1);
        cartelaContract.vincularDono(cartelaId, user2);
    }

    function test_RevertWhen_VincularDono_NotOwner() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user2); // Non-owner tries to transfer
        vm.expectRevert(unicode"CartelaContract: Chamador não é o dono");
        cartelaContract.vincularDono(cartelaId, user2);
    }

    function test_RevertWhen_VincularDono_ToZeroAddress() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Novo dono não pode ser zero");
        cartelaContract.vincularDono(cartelaId, address(0));
    }

    function test_RevertWhen_VincularDono_CardDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert(unicode"CartelaContract: Cartela não existe");
        cartelaContract.vincularDono(999, user2); // Non-existent ID
    }

    // --- Test getNumerosCartela --- //

    function test_GetNumerosCartela_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numerosToRegister = _createDefaultNumbers();
        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numerosToRegister);

        uint[] memory retrievedNumeros = cartelaContract.getNumerosCartela(cartelaId);
        assertEq(retrievedNumeros.length, CARD_SIZE, "Retrieved numeros length mismatch");
        assertEq(retrievedNumeros[0], 1, "Retrieved first number mismatch");
    }

    function test_RevertWhen_GetNumerosCartela_CardDoesNotExist() public {
         // Use a non-existent ID
        vm.expectRevert(unicode"CartelaContract: Cartela não existe");
        cartelaContract.getNumerosCartela(999);
    }

    function test_MarcarEmUso_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela{value: DEFAULT_PRECO}(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        (, , , address dono, , bool emUso, ) = cartelaContract.cartelas(cartelaId);
        assertEq(dono, user1, "Dono mismatch");
        assertTrue(emUso, "Cartela should be in use");
    }

}

