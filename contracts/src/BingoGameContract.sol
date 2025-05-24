// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Corrected paths based on installed library structure
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {CartelaContract} from "./CartelaContract.sol";

/**
 * @title BingoGameContract
 * @dev Manages Bingo game rounds, draws numbers using Chainlink VRF, and determines winners.
 * Inherits from VRFConsumerBaseV2 to interact with Chainlink VRF.
 */
contract BingoGameContract is VRFConsumerBaseV2 {

    // Enum for the state of a Bingo round
    enum EstadoRodada {
        Inativa,    // Round hasn't started or doesn't exist
        Aberta,     // Round is open for players to join
        Sorteando,  // Round is closed, numbers are being drawn (VRF request pending or ongoing)
        Finalizada  // Round has finished, winners determined
    }

    /**
     * @dev Represents a Bingo round.
     */
    struct Rodada {
        uint256 id;
        EstadoRodada estado;
        uint8 numeroMaximo; // e.g., 75 or 90, defines the range of numbers
        uint[] numerosSorteados; // Array to store drawn numbers in order
        mapping(uint => bool) numerosSorteadosMap; // Mapping for quick lookup of drawn numbers
        mapping(uint256 => bool) cartelasParticipantes; // Mapping of participating card IDs for quick lookup
        uint256[] listaCartelasParticipantes; // Array to iterate over participants if needed
        address[] vencedores; // Addresses of the winners
        uint256 ultimoRequestId; // Stores the latest Chainlink VRF request ID for this round
        bool pedidoVrfPendente; // Flag indicating if a VRF request is awaiting fulfillment
        bool premiosDistribuidos; // Flag to track if prizes were already distributed
        // TODO: Add fields for entry fee, prize pool, specific winning rules (e.g., bitmask for line/col/diag/full)
    }

    // Address of the associated CartelaContract
    CartelaContract public immutable cartelaContract;

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    bytes32 s_keyHash; // Gas lane key hash
    uint32 s_callbackGasLimit = 200000; // Increased callback gas limit for winner check logic
    uint16 s_requestConfirmations = 3; // Default request confirmations
    uint32 s_numWords = 1; // Request 1 random word per draw

    // Mapping from VRF request ID to round ID
    mapping(uint256 => uint256) public vrfRequestIdToRodadaId;

    // Counter for generating unique round IDs
    uint256 private _proximaRodadaId;

    // Mapping from round ID to Rodada struct
    mapping(uint256 => Rodada) public rodadas;

    // --- Events --- //
    event RodadaIniciada(
        uint256 indexed rodadaId,
        uint8 numeroMaximo
    );

    event JogadorEntrou(
        uint256 indexed rodadaId,
        uint256 indexed cartelaId,
        address indexed jogador
    );

    event PedidoVrfEnviado(
        uint256 indexed rodadaId,
        uint256 indexed requestId
    );

    event NumeroSorteado(
        uint256 indexed rodadaId,
        uint256 indexed requestId,
        uint256 numeroSorteado // The actual Bingo number derived from random
    );

    event VencedorEncontrado(
        uint256 indexed rodadaId,
        address indexed vencedor,
        uint256 cartelaId
        // TODO: Add winning pattern info
    );

    event RodadaFinalizada(
        uint256 indexed rodadaId
    );

    event PremioDistribuido(
        uint256 indexed rodadaId,
        uint256 totalPrize,
        uint256 winnerCount
    );

    /**
     * @dev Constructor sets the address of the CartelaContract and VRF parameters.
     */
    constructor(
        address _cartelaContractAddress,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_cartelaContractAddress != address(0), "BingoGame: Invalid CartelaContract address");
        cartelaContract = CartelaContract(_cartelaContractAddress);
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_subscriptionId = _subscriptionId;
        s_keyHash = _keyHash;
    }

    // --- Functions --- //

    /**
     * @notice Starts a new Bingo round.
     */
    function iniciarRodada(uint8 _numeroMaximo) public returns (uint256 rodadaId) {
        require(_numeroMaximo >= 10 && _numeroMaximo <= 99, "BingoGame: Numero maximo must be between 10 and 99");
        rodadaId = _proximaRodadaId++;
        Rodada storage novaRodada = rodadas[rodadaId];
        novaRodada.id = rodadaId;
        novaRodada.estado = EstadoRodada.Aberta;
        novaRodada.numeroMaximo = _numeroMaximo;
        emit RodadaIniciada(rodadaId, _numeroMaximo);
        return rodadaId;
    }

    /**
     * @notice Allows a player to join an open Bingo round with a specific card.
     */
    function participar(uint256 _rodadaId, uint256 _cartelaId) public {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.id == _rodadaId && rodada.estado == EstadoRodada.Aberta, "BingoGame: Round is not open or does not exist");
        ( , , , address dono, bool numerosRegistrados) = cartelaContract.cartelas(_cartelaId);
        require(dono != address(0), "BingoGame: Card does not exist");
        require(dono == msg.sender, "BingoGame: Caller is not the owner of the card");
        require(numerosRegistrados, "BingoGame: Card numbers are not registered");
        require(!rodada.cartelasParticipantes[_cartelaId], "BingoGame: Card already participating in this round");
        rodada.cartelasParticipantes[_cartelaId] = true;
        rodada.listaCartelasParticipantes.push(_cartelaId);
        emit JogadorEntrou(_rodadaId, _cartelaId, msg.sender);
    }

    /**
     * @notice Requests a random number from Chainlink VRF to draw the next Bingo number.
     */
    function sortearNumero(uint256 _rodadaId) public /* TODO: Add access control */ returns (uint256 requestId) {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.estado == EstadoRodada.Aberta || rodada.estado == EstadoRodada.Sorteando, "BingoGame: Round not in correct state to draw");
        require(!rodada.pedidoVrfPendente, "BingoGame: Previous VRF request still pending");
        require(rodada.numerosSorteados.length < rodada.numeroMaximo, "BingoGame: All numbers drawn");
        if (rodada.estado == EstadoRodada.Aberta) {
             rodada.estado = EstadoRodada.Sorteando;
        }
        requestId = COORDINATOR.requestRandomWords(s_keyHash, s_subscriptionId, s_requestConfirmations, s_callbackGasLimit, s_numWords);
        rodada.ultimoRequestId = requestId;
        rodada.pedidoVrfPendente = true;
        vrfRequestIdToRodadaId[requestId] = _rodadaId;
        emit PedidoVrfEnviado(_rodadaId, requestId);
        return requestId;
    }

    /**
     * @notice Callback function used by VRF Coordinator to return random numbers.
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        uint256 rodadaId = vrfRequestIdToRodadaId[_requestId];
        Rodada storage rodada = rodadas[rodadaId];
        require(rodada.id == rodadaId, "BingoGame: Invalid round ID for VRF request");
        require(rodada.pedidoVrfPendente && rodada.ultimoRequestId == _requestId, "BingoGame: Invalid or fulfilled VRF request");
        rodada.pedidoVrfPendente = false;
        uint256 numeroAleatorio = _randomWords[0];
        uint256 numeroSorteado;
        uint256 offset = 0;
        bool numeroJaSorteado;
        do {
            numeroSorteado = ((numeroAleatorio + offset) % rodada.numeroMaximo) + 1;
            numeroJaSorteado = rodada.numerosSorteadosMap[numeroSorteado];
            offset++;
            require(offset <= rodada.numeroMaximo, "BingoGame: Could not find unique number");
        } while (numeroJaSorteado);
        rodada.numerosSorteados.push(numeroSorteado);
        rodada.numerosSorteadosMap[numeroSorteado] = true;
        emit NumeroSorteado(rodadaId, _requestId, numeroSorteado);
        _verificarVencedores(rodadaId);
    }

    /**
     * @notice Internal function to check for winners after a number is drawn.
     */
    function _verificarVencedores(uint256 _rodadaId) internal {
        Rodada storage rodada = rodadas[_rodadaId];
        if (rodada.estado == EstadoRodada.Finalizada) return;
        uint256 numParticipantes = rodada.listaCartelasParticipantes.length;
        bool vencedorEncontrado = false;
        for (uint i = 0; i < numParticipantes; i++) {
            uint256 cartelaId = rodada.listaCartelasParticipantes[i];
            ( , uint8 linhas, uint8 colunas, address dono, ) = cartelaContract.cartelas(cartelaId);
            uint[] memory numerosCartela = cartelaContract.getNumerosCartela(cartelaId);
            bool ganhou = false;
            // Check Rows
            for (uint r = 0; r < linhas; r++) {
                bool linhaCompleta = true;
                for (uint c = 0; c < colunas; c++) {
                    if (!rodada.numerosSorteadosMap[numerosCartela[r * colunas + c]]) {
                        linhaCompleta = false; break;
                    }
                }
                if (linhaCompleta) { ganhou = true; break; }
            }
            // Check Columns
            if (!ganhou) {
                for (uint c = 0; c < colunas; c++) {
                    bool colunaCompleta = true;
                    for (uint r = 0; r < linhas; r++) {
                        if (!rodada.numerosSorteadosMap[numerosCartela[r * colunas + c]]) {
                            colunaCompleta = false; break;
                        }
                    }
                    if (colunaCompleta) { ganhou = true; break; }
                }
            }
            // Check Diagonals (if square)
            if (!ganhou && linhas == colunas) {
                 bool diag1Completa = true;
                 bool diag2Completa = true;
                 for (uint d = 0; d < linhas; d++) {
                     if (!rodada.numerosSorteadosMap[numerosCartela[d * colunas + d]]) diag1Completa = false;
                     if (!rodada.numerosSorteadosMap[numerosCartela[d * colunas + (colunas - 1 - d)]]) diag2Completa = false;
                 }
                 if (diag1Completa || diag2Completa) ganhou = true;
            }
            // Process Winner
            if (ganhou) {
                bool jaAdicionado = false;
                for(uint w=0; w < rodada.vencedores.length; w++) {
                    if (rodada.vencedores[w] == dono) { jaAdicionado = true; break; }
                }
                if (!jaAdicionado) {
                    rodada.vencedores.push(dono);
                    vencedorEncontrado = true;
                    emit VencedorEncontrado(_rodadaId, dono, cartelaId);
                }
            }
        }
        if (vencedorEncontrado) {
            rodada.estado = EstadoRodada.Finalizada;
            emit RodadaFinalizada(_rodadaId);
        }
    }

    /**
     * @notice Distributes the prize pool to the winners of a finalized round.
     */
    function distribuirPremios(uint256 _rodadaId) public /* TODO: Add access control */ {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.estado == EstadoRodada.Finalizada, "BingoGame: Round not finalized");
        require(rodada.vencedores.length > 0, "BingoGame: No winners");
        require(!rodada.premiosDistribuidos, "BingoGame: Prizes already distributed");
        // Placeholder: Using contract's balance as prize pool
        uint256 prizePool = address(this).balance;
        require(prizePool > 0, "BingoGame: No prize pool");
        uint256 numVencedores = rodada.vencedores.length;
        uint256 sharePerWinner = prizePool / numVencedores;
        for (uint i = 0; i < numVencedores; i++) {
            address vencedor = rodada.vencedores[i];
            (bool success, ) = payable(vencedor).call{value: sharePerWinner}("");
            require(success, "BingoGame: ETH transfer failed");
        }
        rodada.premiosDistribuidos = true;
        emit PremioDistribuido(_rodadaId, prizePool, numVencedores);
    }

    // TODO: Add helper functions (e.g., getRodadaInfo, getNumerosSorteados)

} // End of BingoGameContract

