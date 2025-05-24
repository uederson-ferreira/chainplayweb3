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
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    uint8 constant DEFAULT_LINHAS = 5;
    uint8 constant DEFAULT_COLUNAS = 5;
    uint constant CARD_SIZE = uint(DEFAULT_LINHAS) * uint(DEFAULT_COLUNAS);

    function setUp() public {
        vm.startPrank(owner);
        cartelaContract = new CartelaContract();
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
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        (uint256 id, uint8 linhas, uint8 colunas, address dono, bool numerosRegistrados) = cartelaContract.cartelas(cartelaId);

        assertEq(id, cartelaId, "ID mismatch");
        assertEq(linhas, DEFAULT_LINHAS, "Linhas mismatch");
        assertEq(colunas, DEFAULT_COLUNAS, "Colunas mismatch");
        assertEq(dono, user1, "Dono mismatch");
        assertFalse(numerosRegistrados, "Numeros should not be registered yet");

        uint[] memory numeros = cartelaContract.getNumerosCartela(cartelaId);
        assertEq(numeros.length, 0, "Numeros array should be empty initially");
    }

    function test_CriarCartela_EmitEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CartelaContract.CartelaCriada(0, user1, DEFAULT_LINHAS, DEFAULT_COLUNAS);
        vm.prank(user1);
        cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
    }

    function test_RevertWhen_CriarCartela_ZeroLinhas() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Rows must be greater than 0");
        cartelaContract.criarCartela(0, DEFAULT_COLUNAS);
    }

    function test_RevertWhen_CriarCartela_ZeroColunas() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Columns must be greater than 0");
        cartelaContract.criarCartela(DEFAULT_LINHAS, 0);
    }

     function test_RevertWhen_CriarCartela_TooLarge() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Card size too large (max 255 cells)");
        cartelaContract.criarCartela(16, 16); // 16*16 = 256 > 255 limit
    }

    // --- Test registrarNumerosCartela --- //

    function test_RegistrarNumeros_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numerosToRegister = _createDefaultNumbers();

        vm.prank(user1); // Must be owner
        cartelaContract.registrarNumerosCartela(cartelaId, numerosToRegister);

        (, , , , bool numerosRegistrados) = cartelaContract.cartelas(cartelaId);
        assertTrue(numerosRegistrados, "Numeros should be registered");

        uint[] memory registeredNumeros = cartelaContract.getNumerosCartela(cartelaId);
        assertEq(registeredNumeros.length, CARD_SIZE, "Numeros array length mismatch");
        assertEq(registeredNumeros[0], 1, "First number mismatch");
        assertEq(registeredNumeros[CARD_SIZE - 1], CARD_SIZE, "Last number mismatch");
    }

    function test_RegistrarNumeros_EmitEvent() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.expectEmit(true, false, false, true);
        emit CartelaContract.NumerosCartelaRegistrados(cartelaId, numeros);

        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_NotOwner() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.prank(user2); // Different user tries to register
        vm.expectRevert("CartelaContract: Caller is not the owner");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_AlreadyRegistered() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();

        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);

        // Try registering again
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Numbers already registered");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_IncorrectLength() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = new uint[](CARD_SIZE - 1); // Incorrect size
        for(uint i = 0; i < numeros.length; i++) { numeros[i] = i+1; }

        vm.prank(user1);
        vm.expectRevert("CartelaContract: Incorrect number of elements");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    function test_RevertWhen_RegistrarNumeros_NumberOutOfRangeZero() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();
        numeros[0] = 0; // Invalid number

        vm.prank(user1);
        vm.expectRevert("CartelaContract: Number out of range (1-99)");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

     function test_RevertWhen_RegistrarNumeros_NumberOutOfRangeHigh() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numeros = _createDefaultNumbers();
        numeros[0] = 100; // Invalid number (>= 100)

        vm.prank(user1);
        vm.expectRevert("CartelaContract: Number out of range (1-99)");
        cartelaContract.registrarNumerosCartela(cartelaId, numeros);
    }

    // --- Test vincularDono --- //

    function test_VincularDono_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user1); // Current owner transfers
        cartelaContract.vincularDono(cartelaId, user2);

        (, , , address dono, ) = cartelaContract.cartelas(cartelaId);
        assertEq(dono, user2, "New owner mismatch");
    }

    function test_VincularDono_EmitEvent() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.expectEmit(true, true, true, false);
        emit CartelaContract.DonoCartelaTransferido(cartelaId, user1, user2);

        vm.prank(user1);
        cartelaContract.vincularDono(cartelaId, user2);
    }

    function test_RevertWhen_VincularDono_NotOwner() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user2); // Non-owner tries to transfer
        vm.expectRevert("CartelaContract: Caller is not the owner");
        cartelaContract.vincularDono(cartelaId, user2);
    }

    function test_RevertWhen_VincularDono_ToZeroAddress() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);

        vm.prank(user1);
        vm.expectRevert("CartelaContract: New owner cannot be the zero address");
        cartelaContract.vincularDono(cartelaId, address(0));
    }

    function test_RevertWhen_VincularDono_CardDoesNotExist() public {
        vm.prank(user1);
        vm.expectRevert("CartelaContract: Cartela does not exist or was not properly initialized");
        cartelaContract.vincularDono(999, user2); // Non-existent ID
    }

    // --- Test getNumerosCartela --- //

    function test_GetNumerosCartela_Success() public {
        vm.prank(user1);
        uint256 cartelaId = cartelaContract.criarCartela(DEFAULT_LINHAS, DEFAULT_COLUNAS);
        uint[] memory numerosToRegister = _createDefaultNumbers();
        vm.prank(user1);
        cartelaContract.registrarNumerosCartela(cartelaId, numerosToRegister);

        uint[] memory retrievedNumeros = cartelaContract.getNumerosCartela(cartelaId);
        assertEq(retrievedNumeros.length, CARD_SIZE, "Retrieved numeros length mismatch");
        assertEq(retrievedNumeros[0], 1, "Retrieved first number mismatch");
    }

    function test_RevertWhen_GetNumerosCartela_CardDoesNotExist() public {
         // Use a non-existent ID
        vm.expectRevert("CartelaContract: Cartela does not exist or was not properly initialized");
        cartelaContract.getNumerosCartela(999);
    }

}

