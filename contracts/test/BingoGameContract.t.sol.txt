// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/vrf/VRFConsumerBaseV2.sol";
import {CartelaContract} from "../src/CartelaContract.sol";

contract BingoGameContract is VRFConsumerBaseV2 {
    using SafeMath for uint256;

    enum EstadoRodada {
        Inativa,
        Aberta,
        Sorteando,
        Finalizada,
        Cancelada
    }

    enum PadraoVitoria {
        Linha,
        Coluna,
        Diagonal,
        Cartela
    }

    struct Rodada {
        uint256 id;
        EstadoRodada estado;
        uint8 numeroMaximo;
        uint[] numerosSorteados;
        mapping(uint => bool) numerosSorteadosMap;
        mapping(uint256 => bool) cartelasParticipantes;
        uint256[] listaCartelasParticipantes;
        address[] vencedores;
        uint256 ultimoRequestId;
        bool pedidoVrfPendente;
        bool premiosDistribuidos;
        uint256 taxaEntrada;
        uint256 premioTotal;
        uint256 timestampInicio;
        uint256 timeoutRodada;
        mapping(PadraoVitoria => bool) padroesVitoriaAtivos;
        mapping(address => uint256) premiosVencedores;
    }

    CartelaContract public immutable cartelaContract;
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    bytes32 s_keyHash;
    uint32 s_callbackGasLimit = 200000;
    uint16 s_requestConfirmations = 3;
    uint32 s_numWords = 1;

    mapping(uint256 => uint256) public vrfRequestIdToRodadaId;
    uint256 private _proximaRodadaId;
    mapping(uint256 => Rodada) public rodadas;
    address public admin;
    address public feeCollector;
    mapping(address => bool) public operadores;

    uint256 public constant TAXA_ADMIN = 5;
    uint256 public constant TAXA_PLATAFORMA = 5;
    uint256 public constant TIMEOUT_PADRAO = 1 hours;

    event RodadaIniciada(uint256 indexed rodadaId, uint8 numeroMaximo, uint256 taxaEntrada, uint256 timeoutRodada);
    event JogadorEntrou(uint256 indexed rodadaId, uint256 indexed cartelaId, address indexed jogador, uint256 taxaPaga);
    event PedidoVrfEnviado(uint256 indexed rodadaId, uint256 indexed requestId);
    event NumeroSorteado(uint256 indexed rodadaId, uint256 indexed requestId, uint256 numeroSorteado);
    event VencedorEncontrado(uint256 indexed rodadaId, address indexed vencedor, uint256 cartelaId, PadraoVitoria padrao);
    event RodadaFinalizada(uint256 indexed rodadaId, uint256 premioTotal, uint256 numVencedores);
    event RodadaCancelada(uint256 indexed rodadaId, string motivo);
    event AdminAtualizado(address adminAnterior, address novoAdmin);
    event FeeCollectorAtualizado(address feeCollectorAnterior, address novoFeeCollector);
    event OperadorAtualizado(address operador, bool status);
    event PremioDistribuido(uint256 indexed rodadaId, address indexed vencedor, uint256 premio);

    modifier apenasAdmin() {
        require(msg.sender == admin, unicode"BingoGame: Apenas admin pode chamar");
        _;
    }

    modifier apenasOperador() {
        require(operadores[msg.sender], unicode"BingoGame: Apenas operador pode chamar");
        _;
    }

    modifier rodadaExiste(uint256 _rodadaId) {
        require(rodadas[_rodadaId].id == _rodadaId, unicode"BingoGame: Round does not exist");
        _;
    }

    modifier rodadaAtiva(uint256 _rodadaId) {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.estado == EstadoRodada.Aberta || rodada.estado == EstadoRodada.Sorteando,
            unicode"BingoGame: Round is not active");
        require(block.timestamp <= rodada.timestampInicio + rodada.timeoutRodada,
            unicode"BingoGame: Round expired");
        _;
    }

    constructor(
        address _cartelaContractAddress,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _admin,
        address _feeCollector
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_cartelaContractAddress != address(0), "BingoGame: Invalid CartelaContract address");
        cartelaContract = CartelaContract(_cartelaContractAddress);
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_subscriptionId = _subscriptionId;
        s_keyHash = _keyHash;
        admin = _admin;
        feeCollector = _feeCollector;
        cartelaContract.setBingoGameContract(address(this));
    }

    function iniciarRodada(
        uint8 _numeroMaximo,
        uint256 _taxaEntrada,
        uint256 _timeoutRodada,
        bool[] calldata _padroesVitoria
    ) external apenasOperador returns (uint256 rodadaId) {
        require(_numeroMaximo >= 10 && _numeroMaximo <= 99, unicode"BingoGame: Numero maximo must be between 10 and 99");
        require(_taxaEntrada > 0, unicode"BingoGame: Taxa de entrada deve ser maior que zero");
        require(_timeoutRodada >= 30 minutes && _timeoutRodada <= 24 hours, 
            unicode"BingoGame: Timeout deve estar entre 30 minutos e 24 horas");
        require(_padroesVitoria.length == 4, unicode"BingoGame: Deve especificar todos os padrões de vitória");

        rodadaId = _proximaRodadaId++;
        Rodada storage novaRodada = rodadas[rodadaId];
        novaRodada.id = rodadaId;
        novaRodada.estado = EstadoRodada.Aberta;
        novaRodada.numeroMaximo = _numeroMaximo;
        novaRodada.taxaEntrada = _taxaEntrada;
        novaRodada.timeoutRodada = _timeoutRodada;
        novaRodada.timestampInicio = block.timestamp;

        for (uint i = 0; i < 4; i++) {
            novaRodada.padroesVitoriaAtivos[PadraoVitoria(i)] = _padroesVitoria[i];
        }

        emit RodadaIniciada(rodadaId, _numeroMaximo, _taxaEntrada, _timeoutRodada);
        return rodadaId;
    }

    function participar(uint256 _rodadaId, uint256 _cartelaId) 
        external 
        payable 
        rodadaExiste(_rodadaId) 
        rodadaAtiva(_rodadaId) 
    {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.estado == EstadoRodada.Aberta, unicode"BingoGame: Round is not open");
        require(msg.value >= rodada.taxaEntrada, unicode"BingoGame: Insufficient entry fee");

        (, , , address dono, bool numerosRegistrados, bool emUso, ) = cartelaContract.cartelas(_cartelaId);
        require(dono != address(0), unicode"BingoGame: Card does not exist");
        require(dono == msg.sender, unicode"BingoGame: Caller is not the owner of the card");
        require(numerosRegistrados, unicode"BingoGame: Card numbers are not registered");
        require(!rodada.cartelasParticipantes[_cartelaId], unicode"BingoGame: Card already participating");

        cartelaContract.marcarEmUso(_cartelaId, true);
        rodada.cartelasParticipantes[_cartelaId] = true;
        rodada.listaCartelasParticipantes.push(_cartelaId);
        rodada.premioTotal = rodada.premioTotal.add(msg.value);

        emit JogadorEntrou(_rodadaId, _cartelaId, msg.sender, msg.value);
    }

    function sortearNumero(uint256 _rodadaId) 
        external 
        apenasOperador 
        rodadaExiste(_rodadaId) 
        rodadaAtiva(_rodadaId) 
        returns (uint256 requestId) 
    {
        Rodada storage rodada = rodadas[_rodadaId];
        require(!rodada.pedidoVrfPendente, unicode"BingoGame: Previous VRF request still pending");
        require(rodada.numerosSorteados.length < rodada.numeroMaximo, unicode"BingoGame: All numbers drawn");

        if (rodada.estado == EstadoRodada.Aberta) {
            rodada.estado = EstadoRodada.Sorteando;
        }

        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            s_requestConfirmations,
            s_callbackGasLimit,
            s_numWords
        );

        rodada.ultimoRequestId = requestId;
        rodada.pedidoVrfPendente = true;
        vrfRequestIdToRodadaId[requestId] = _rodadaId;

        emit PedidoVrfEnviado(_rodadaId, requestId);
        return requestId;
    }

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

    function _verificarVencedores(uint256 _rodadaId) internal {
        Rodada storage rodada = rodadas[_rodadaId];
        if (rodada.estado == EstadoRodada.Finalizada) return;
        uint256 numParticipantes = rodada.listaCartelasParticipantes.length;
        bool vencedorEncontrado = false;
        for (uint i = 0; i < numParticipantes; i++) {
            uint256 cartelaId = rodada.listaCartelasParticipantes[i];
            (, uint8 linhas, uint8 colunas, address dono, , bool emUso, ) = cartelaContract.cartelas(cartelaId);
            uint[] memory numerosCartela = cartelaContract.getNumerosCartela(cartelaId);
            bool ganhou = false;
            if (rodada.padroesVitoriaAtivos[PadraoVitoria.Linha]) {
                if (_verificarLinhas(rodada, numerosCartela, linhas, colunas)) {
                    ganhou = true;
                }
            }
            if (!ganhou && rodada.padroesVitoriaAtivos[PadraoVitoria.Coluna]) {
                if (_verificarColunas(rodada, numerosCartela, linhas, colunas)) {
                    ganhou = true;
                }
            }
            if (!ganhou && linhas == colunas && rodada.padroesVitoriaAtivos[PadraoVitoria.Diagonal]) {
                if (_verificarDiagonais(rodada, numerosCartela, linhas, colunas)) {
                    ganhou = true;
                }
            }
            if (!ganhou && rodada.padroesVitoriaAtivos[PadraoVitoria.Cartela]) {
                if (_verificarCartelaCompleta(rodada, numerosCartela)) {
                    ganhou = true;
                }
            }
            if (ganhou) {
                bool jaAdicionado = false;
                for(uint w=0; w < rodada.vencedores.length; w++) {
                    if (rodada.vencedores[w] == dono) { jaAdicionado = true; break; }
                }
                if (!jaAdicionado) {
                    rodada.vencedores.push(dono);
                    vencedorEncontrado = true;
                    _registrarVencedor(rodada, dono, cartelaId, PadraoVitoria.Linha);
                }
            }
        }
        if (vencedorEncontrado) {
            _finalizarRodada(rodada);
        }
    }

    function _verificarLinhas(
        Rodada storage rodada,
        uint[] memory numerosCartela,
        uint8 linhas,
        uint8 colunas
    ) internal view returns (bool) {
        for (uint r = 0; r < linhas; r++) {
            bool linhaCompleta = true;
            for (uint c = 0; c < colunas; c++) {
                if (!rodada.numerosSorteadosMap[numerosCartela[r * colunas + c]]) {
                    linhaCompleta = false;
                    break;
                }
            }
            if (linhaCompleta) return true;
        }
        return false;
    }

    function _verificarColunas(
        Rodada storage rodada,
        uint[] memory numerosCartela,
        uint8 linhas,
        uint8 colunas
    ) internal view returns (bool) {
        for (uint c = 0; c < colunas; c++) {
            bool colunaCompleta = true;
            for (uint r = 0; r < linhas; r++) {
                if (!rodada.numerosSorteadosMap[numerosCartela[r * colunas + c]]) {
                    colunaCompleta = false;
                    break;
                }
            }
            if (colunaCompleta) return true;
        }
        return false;
    }

    function _verificarDiagonais(
        Rodada storage rodada,
        uint[] memory numerosCartela,
        uint8 linhas,
        uint8 colunas
    ) internal view returns (bool) {
        bool diag1Completa = true;
        for (uint d = 0; d < linhas; d++) {
            if (!rodada.numerosSorteadosMap[numerosCartela[d * colunas + d]]) diag1Completa = false;
        }
        if (diag1Completa) return true;

        bool diag2Completa = true;
        for (uint d = 0; d < linhas; d++) {
            if (!rodada.numerosSorteadosMap[numerosCartela[d * colunas + (colunas - 1 - d)]]) diag2Completa = false;
        }
        return diag2Completa;
    }

    function _verificarCartelaCompleta(
        Rodada storage rodada,
        uint[] memory numerosCartela
    ) internal view returns (bool) {
        for (uint i = 0; i < numerosCartela.length; i++) {
            if (!rodada.numerosSorteadosMap[numerosCartela[i]]) {
                return false;
            }
        }
        return true;
    }

    function _registrarVencedor(
        Rodada storage rodada,
        address vencedor,
        uint256 cartelaId,
        PadraoVitoria padrao
    ) internal {
        for (uint i = 0; i < rodada.vencedores.length; i++) {
            if (rodada.vencedores[i] == vencedor) {
                return;
            }
        }

        rodada.vencedores.push(vencedor);
        emit VencedorEncontrado(rodada.id, vencedor, cartelaId, padrao);
    }

    function _finalizarRodada(Rodada storage rodada) internal {
        rodada.estado = EstadoRodada.Finalizada;

        uint256 premioPorVencedor = rodada.premioTotal.div(rodada.vencedores.length);
        uint256 taxaAdmin = rodada.premioTotal.mul(TAXA_ADMIN).div(100);
        uint256 taxaPlataforma = rodada.premioTotal.mul(TAXA_PLATAFORMA).div(100);

        for (uint i = 0; i < rodada.vencedores.length; i++) {
            address vencedor = rodada.vencedores[i];
            rodada.premiosVencedores[vencedor] = premioPorVencedor;
            (bool success, ) = vencedor.call{value: premioPorVencedor}("");
            require(success, "BingoGame: Failed to distribute prize");
            emit PremioDistribuido(rodada.id, vencedor, premioPorVencedor);
        }

        (bool successAdmin, ) = admin.call{value: taxaAdmin}("");
        require(successAdmin, "BingoGame: Failed to send admin tax");
        (bool successPlataforma, ) = feeCollector.call{value: taxaPlataforma}("");
        require(successPlataforma, "BingoGame: Failed to send platform tax");

        for (uint i = 0; i < rodada.listaCartelasParticipantes.length; i++) {
            cartelaContract.marcarEmUso(rodada.listaCartelasParticipantes[i], false);
        }

        emit RodadaFinalizada(rodada.id, rodada.premioTotal, rodada.vencedores.length);
    }

    function cancelarRodada(uint256 _rodadaId, string calldata _motivo) 
        external 
        apenasOperador 
        rodadaExiste(_rodadaId) 
    {
        Rodada storage rodada = rodadas[_rodadaId];
        require(rodada.estado != EstadoRodada.Finalizada && rodada.estado != EstadoRodada.Cancelada,
            "BingoGame: Round already finalized or canceled");

        for (uint i = 0; i < rodada.listaCartelasParticipantes.length; i++) {
            cartelaContract.marcarEmUso(rodada.listaCartelasParticipantes[i], false);
        }

        if (rodada.premioTotal > 0) {
            uint256 valorPorJogador = rodada.premioTotal.div(rodada.listaCartelasParticipantes.length);
            for (uint i = 0; i < rodada.listaCartelasParticipantes.length; i++) {
                (, , , address dono, , , ) = cartelaContract.cartelas(rodada.listaCartelasParticipantes[i]);
                (bool success, ) = dono.call{value: valorPorJogador}("");
                require(success, "BingoGame: Failed to return prize");
            }
        }

        rodada.estado = EstadoRodada.Cancelada;
        emit RodadaCancelada(_rodadaId, _motivo);
    }

    function setOperador(address _operador, bool _status) external apenasAdmin {
        require(_operador != address(0), unicode"BingoGame: Operador não pode ser zero");
        operadores[_operador] = _status;
        emit OperadorAtualizado(_operador, _status);
    }

    function getUltimoRequestId(uint256 _rodadaId) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (uint256) 
    {
        return rodadas[_rodadaId].ultimoRequestId;
    }

    function getNumerosSorteados(uint256 _rodadaId) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (uint[] memory) 
    {
        return rodadas[_rodadaId].numerosSorteados;
    }

    function getVencedores(uint256 _rodadaId) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (address[] memory) 
    {
        return rodadas[_rodadaId].vencedores;
    }

    function getPremioVencedor(uint256 _rodadaId, address _vencedor) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (uint256) 
    {
        return rodadas[_rodadaId].premiosVencedores[_vencedor];
    }

    function getCartelasParticipantes(uint256 _rodadaId) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (uint256[] memory) 
    {
        return rodadas[_rodadaId].listaCartelasParticipantes;
    }

    function verificarTimeoutRodada(uint256 _rodadaId) 
        external 
        view 
        rodadaExiste(_rodadaId) 
        returns (bool) 
    {
        Rodada storage rodada = rodadas[_rodadaId];
        return block.timestamp > rodada.timestampInicio + rodada.timeoutRodada;
    }
}

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }
}