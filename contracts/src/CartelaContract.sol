// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CartelaContract
 * @dev Gerencia a criação e propriedade de cartelas de Bingo personalizáveis.
 * Inclui sistema de preços e validações de números únicos.
 */
contract CartelaContract {
    // Preço base para criação de cartela (em wei)
    uint256 public precoBaseCartela;
    
    // Endereço que recebe as taxas
    address public feeCollector;

    // Endereço do contrato do jogo que pode marcar cartelas como em uso
    address public bingoGameContract;

    address public admin; // Adicionar variável admin

    mapping(address => bool) public operadores;

    /**
     * @dev Representa uma cartela de Bingo.
     * `numeros` armazena os números da cartela em um array unidimensional.
     * O layout (linhas, colunas) é armazenado separadamente para interpretar o array `numeros`.
     */
    struct Cartela {
        uint256 id;
        uint8 linhas; // Número de linhas
        uint8 colunas; // Número de colunas
        uint[] numeros; // Array unidimensional dos números da cartela
        address dono; // Proprietário da cartela
        bool numerosRegistrados; // Flag para verificar se os números foram definidos
        bool emUso; // Flag para verificar se a cartela está em uso em alguma rodada
        uint256 preco; // Preço pago pela cartela
    }

    // Contador para gerar IDs únicos de cartela
    uint256 private _proximoCartelaId;

    // Mapping de ID da cartela para struct Cartela
    mapping(uint256 => Cartela) public cartelas;

    // Mapping para verificar números únicos em uma cartela
    mapping(uint256 => mapping(uint => bool)) private numerosCartela;

    // Eventos
    event CartelaCriada(
        uint256 indexed cartelaId,
        address indexed donoInicial,
        uint8 linhas,
        uint8 colunas,
        uint256 preco
    );

    event NumerosCartelaRegistrados(
        uint256 indexed cartelaId,
        uint[] numeros
    );

    event DonoCartelaTransferido(
        uint256 indexed cartelaId,
        address indexed donoAnterior,
        address indexed novoDono
    );

    event PrecoBaseAtualizado(
        uint256 precoAnterior,
        uint256 novoPreco
    );

    event FeeCollectorAtualizado(
        address feeCollectorAnterior,
        address novoFeeCollector
    );

    event CartelaMarcadaEmUso(
        uint256 indexed cartelaId,
        bool emUso
    );

    event BingoGameContractAtualizado(
        address bingoGameContractAnterior,
        address novoBingoGameContract
    );

    event DebugAdmin(address sender, address feeCollector);

    // Modificadores
    modifier apenasDono(uint256 _cartelaId) {
        require(cartelas[_cartelaId].dono == msg.sender, unicode"CartelaContract: Chamador não é o dono");
        _;
    }

    modifier cartelaExiste(uint256 _cartelaId) {
        require(cartelas[_cartelaId].dono != address(0), unicode"CartelaContract: Cartela não existe");
        _;
    }

    modifier apenasFeeCollector() {
        require(msg.sender == feeCollector, unicode"CartelaContract: Apenas fee collector pode chamar");
        _;
    }

    modifier apenasBingoGame() {
        require(msg.sender == bingoGameContract, unicode"CartelaContract: Apenas o contrato do jogo pode chamar esta função");
        _;
    }

    modifier apenasAdmin() {
        emit DebugAdmin(msg.sender, feeCollector);
        require(msg.sender == feeCollector || msg.sender == admin || operadores[msg.sender], 
            unicode"CartelaContract: Apenas admin ou operadores podem chamar esta função");
        _;
    }

    /**
     * @dev Construtor define o preço base e o coletor de taxas
     */
    constructor(uint256 _precoBaseCartela, address _feeCollector) {
        require(_feeCollector != address(0), unicode"CartelaContract: Fee collector não pode ser zero");
        precoBaseCartela = _precoBaseCartela;
        feeCollector = _feeCollector;
        admin = _feeCollector; // Definir admin como feeCollector
        operadores[_feeCollector] = true; // Adiciona o feeCollector como operador inicial
        emit DebugAdmin(msg.sender, _feeCollector); // Adiciona log para debug
    }

    // --- Funções Administrativas --- //

    /**
     * @notice Atualiza o preço base para criação de cartelas
     * @dev Apenas o fee collector pode chamar
     */
    function atualizarPrecoBase(uint256 _novoPreco) external apenasFeeCollector {
        uint256 precoAnterior = precoBaseCartela;
        precoBaseCartela = _novoPreco;
        emit PrecoBaseAtualizado(precoAnterior, _novoPreco);
    }

    /**
     * @notice Atualiza o endereço do coletor de taxas
     * @dev Apenas o fee collector atual pode chamar
     */
    function atualizarFeeCollector(address _novoFeeCollector) external apenasFeeCollector {
        require(_novoFeeCollector != address(0), unicode"CartelaContract: Novo fee collector não pode ser zero");
        address feeCollectorAnterior = feeCollector;
        feeCollector = _novoFeeCollector;
        emit FeeCollectorAtualizado(feeCollectorAnterior, _novoFeeCollector);
    }

    function setBingoGameContract(address _bingoGameContract) external apenasAdmin {
        require(_bingoGameContract != address(0), unicode"CartelaContract: Endereço do contrato do jogo não pode ser zero");
        address bingoGameContractAnterior = bingoGameContract;
        bingoGameContract = _bingoGameContract;
        emit BingoGameContractAtualizado(bingoGameContractAnterior, _bingoGameContract);
    }

    function setOperador(address operador, bool status) external apenasAdmin {
        operadores[operador] = status;
    }

    // --- Funções Públicas --- //

    /**
     * @notice Cria uma nova estrutura de cartela com dimensões especificadas
     * @dev Atribui um ID único, define o chamador como dono inicial
     * Os números precisam ser registrados separadamente usando `registrarNumerosCartela`
     * @param _linhas Número de linhas da cartela
     * @param _colunas Número de colunas da cartela
     * @return cartelaId O ID da cartela recém-criada
     */
    function criarCartela(uint8 _linhas, uint8 _colunas) public payable returns (uint256 cartelaId) {
        require(_linhas > 0, unicode"CartelaContract: Linhas devem ser maiores que 0");
        require(_colunas > 0, unicode"CartelaContract: Colunas devem ser maiores que 0");
        require(uint256(_linhas) * uint256(_colunas) <= 255, unicode"CartelaContract: Tamanho da cartela muito grande (máx 255 células)");
        require(msg.value >= precoBaseCartela, unicode"CartelaContract: Valor insuficiente para criar cartela");

        cartelaId = _proximoCartelaId++;
        Cartela storage novaCartela = cartelas[cartelaId];
        novaCartela.id = cartelaId;
        novaCartela.linhas = _linhas;
        novaCartela.colunas = _colunas;
        novaCartela.dono = msg.sender;
        novaCartela.numerosRegistrados = false;
        novaCartela.emUso = false;
        novaCartela.preco = msg.value;

        // Envia a taxa para o fee collector
        (bool success, ) = feeCollector.call{value: msg.value}("");
        require(success, unicode"CartelaContract: Falha ao transferir taxa");

        emit CartelaCriada(cartelaId, msg.sender, _linhas, _colunas, msg.value);
        return cartelaId;
    }

    /**
     * @notice Registra os números para uma cartela específica
     * @dev Pode ser chamado apenas pelo dono da cartela e apenas uma vez
     * O número de elementos em `_numeros` deve corresponder a `linhas * colunas`
     * @param _cartelaId O ID da cartela para registrar os números
     * @param _numeros Array unidimensional dos números da cartela
     */
    function registrarNumerosCartela(uint256 _cartelaId, uint[] calldata _numeros) 
        external 
        apenasDono(_cartelaId) 
        cartelaExiste(_cartelaId) 
    {
        Cartela storage cartela = cartelas[_cartelaId];
        require(!cartela.numerosRegistrados, unicode"CartelaContract: Números já registrados");
        require(!cartela.emUso, unicode"CartelaContract: Cartela está em uso");
        require(_numeros.length == uint256(cartela.linhas) * uint256(cartela.colunas), 
            unicode"CartelaContract: Número incorreto de elementos");

        // Limpa o mapping de números anteriores
        for (uint i = 0; i < _numeros.length; i++) {
            delete numerosCartela[_cartelaId][_numeros[i]];
        }

        // Valida e registra os novos números
        for (uint i = 0; i < _numeros.length; i++) {
            uint numero = _numeros[i];
            require(numero > 0 && numero < 100, unicode"CartelaContract: Número fora do intervalo (1-99)");
            require(!numerosCartela[_cartelaId][numero], unicode"CartelaContract: Número duplicado na cartela");
            numerosCartela[_cartelaId][numero] = true;
        }

        cartela.numeros = _numeros;
        cartela.numerosRegistrados = true;

        emit NumerosCartelaRegistrados(_cartelaId, _numeros);
    }

    /**
     * @notice Transfere a propriedade de uma cartela para um novo endereço
     * @dev Pode ser chamado apenas pelo dono atual
     * @param _cartelaId O ID da cartela para transferir
     * @param _novoDono O endereço do novo dono
     */
    function vincularDono(uint256 _cartelaId, address _novoDono) 
        external 
        cartelaExiste(_cartelaId) 
        apenasDono(_cartelaId) 
    {
        require(_novoDono != address(0), unicode"CartelaContract: Novo dono não pode ser zero");
        require(!cartelas[_cartelaId].emUso, unicode"CartelaContract: Cartela está em uso");
        
        Cartela storage cartela = cartelas[_cartelaId];
        address donoAnterior = cartela.dono;
        cartela.dono = _novoDono;

        emit DonoCartelaTransferido(_cartelaId, donoAnterior, _novoDono);
    }

    /**
     * @notice Marca uma cartela como em uso ou não
     * @dev Apenas o contrato do jogo pode chamar
     * @param _cartelaId O ID da cartela
     * @param _emUso Novo estado de uso
     */
    function marcarEmUso(uint256 _cartelaId, bool _emUso) 
        external 
        apenasBingoGame
        cartelaExiste(_cartelaId) 
    {
        cartelas[_cartelaId].emUso = _emUso;
        emit CartelaMarcadaEmUso(_cartelaId, _emUso);
    }

    // --- Funções View --- //

    /**
     * @notice Obtém o array de números para uma cartela específica
     * @dev Necessário porque o getter público do mapping não retorna arrays dinâmicos
     * @param _cartelaId O ID da cartela
     * @return O array de números da cartela
     */
    function getNumerosCartela(uint256 _cartelaId) 
        external 
        view 
        cartelaExiste(_cartelaId) 
        returns (uint[] memory) 
    {
        return cartelas[_cartelaId].numeros;
    }

    /**
     * @notice Verifica se uma cartela está em uso
     * @param _cartelaId O ID da cartela
     * @return bool Indicando se a cartela está em uso
     */
    function cartelaEmUso(uint256 _cartelaId) 
        external 
        view 
        cartelaExiste(_cartelaId) 
        returns (bool) 
    {
        return cartelas[_cartelaId].emUso;
    }

    /**
     * @notice Verifica se um número específico existe em uma cartela
     * @param _cartelaId O ID da cartela
     * @param _numero O número a ser verificado
     * @return bool Indicando se o número existe na cartela
     */
    function numeroExisteNaCartela(uint256 _cartelaId, uint _numero) 
        external 
        view 
        cartelaExiste(_cartelaId) 
        returns (bool) 
    {
        return numerosCartela[_cartelaId][_numero];
    }
}

