// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CartelaContract
 * @dev Manages the creation and ownership of customizable Bingo cards.
 */
contract CartelaContract {

    /**
     * @dev Represents a Bingo card.
     * `numeros` stores the card numbers in a flattened 1D array.
     * The layout (rows, columns) is stored separately to interpret the `numeros` array.
     */
    struct Cartela {
        uint256 id;
        uint8 linhas; // Number of rows
        uint8 colunas; // Number of columns
        uint[] numeros; // Flattened array of numbers on the card
        address dono; // Owner of the card
        bool numerosRegistrados; // Flag to check if numbers have been set
    }

    // Counter for generating unique card IDs
    uint256 private _proximoCartelaId;

    // Mapping from card ID to Cartela struct
    // The public getter will return id, linhas, colunas, dono, numerosRegistrados
    // It will NOT return the dynamic array 'numeros'
    mapping(uint256 => Cartela) public cartelas;

    // Event emitted when a new card structure is created (without numbers yet)
    event CartelaCriada(
        uint256 indexed cartelaId,
        address indexed donoInicial,
        uint8 linhas,
        uint8 colunas
    );

    // Event emitted when numbers are registered to a card
    event NumerosCartelaRegistrados(
        uint256 indexed cartelaId,
        uint[] numeros
    );

    // Event emitted when the owner of a card changes
    event DonoCartelaTransferido(
        uint256 indexed cartelaId,
        address indexed donoAnterior,
        address indexed novoDono
    );

    /**
     * @dev Modifier to check if the caller is the owner of a specific card.
     */
    modifier apenasDono(uint256 _cartelaId) {
        require(cartelas[_cartelaId].dono == msg.sender, "CartelaContract: Caller is not the owner");
        _;
    }

    /**
     * @dev Modifier to check if a card exists.
     */
     modifier cartelaExiste(uint256 _cartelaId) {
        require(cartelas[_cartelaId].dono != address(0), "CartelaContract: Cartela does not exist or was not properly initialized");
        _;
     }

    // --- Functions --- //

    /**
     * @notice Creates a new Bingo card structure with specified dimensions.
     * @dev Assigns a unique ID, sets the caller as the initial owner.
     * Numbers need to be registered separately using `registrarNumerosCartela`.
     * @param _linhas Number of rows for the card.
     * @param _colunas Number of columns for the card.
     * @return cartelaId The ID of the newly created card.
     */
    function criarCartela(uint8 _linhas, uint8 _colunas) public returns (uint256 cartelaId) {
        require(_linhas > 0, "CartelaContract: Rows must be greater than 0");
        require(_colunas > 0, "CartelaContract: Columns must be greater than 0");
        require(uint256(_linhas) * uint256(_colunas) <= 255, "CartelaContract: Card size too large (max 255 cells)");

        cartelaId = _proximoCartelaId++;
        Cartela storage novaCartela = cartelas[cartelaId];
        novaCartela.id = cartelaId;
        novaCartela.linhas = _linhas;
        novaCartela.colunas = _colunas;
        novaCartela.dono = msg.sender;
        novaCartela.numerosRegistrados = false;

        emit CartelaCriada(cartelaId, msg.sender, _linhas, _colunas);
        return cartelaId;
    }

    /**
     * @notice Registers the numbers for a specific Bingo card.
     * @dev Can only be called by the card owner and only once.
     * The number of elements in `_numeros` must match `linhas * colunas`.
     * @param _cartelaId The ID of the card to register numbers for.
     * @param _numeros Flattened array of numbers for the card.
     */
    function registrarNumerosCartela(uint256 _cartelaId, uint[] calldata _numeros) public apenasDono(_cartelaId) cartelaExiste(_cartelaId) {
        Cartela storage cartela = cartelas[_cartelaId];
        require(!cartela.numerosRegistrados, "CartelaContract: Numbers already registered");
        require(_numeros.length == uint256(cartela.linhas) * uint256(cartela.colunas), "CartelaContract: Incorrect number of elements");

        for (uint i = 0; i < _numeros.length; i++) {
            require(_numeros[i] > 0 && _numeros[i] < 100, "CartelaContract: Number out of range (1-99)");
        }

        cartela.numeros = _numeros;
        cartela.numerosRegistrados = true;

        emit NumerosCartelaRegistrados(_cartelaId, _numeros);
    }

    /**
     * @notice Transfers ownership of a Bingo card to a new address.
     * @dev Can only be called by the current owner.
     * @param _cartelaId The ID of the card to transfer.
     * @param _novoDono The address of the new owner.
     */
    function vincularDono(uint256 _cartelaId, address _novoDono) public cartelaExiste(_cartelaId) apenasDono(_cartelaId) {
        require(_novoDono != address(0), "CartelaContract: New owner cannot be the zero address");
        Cartela storage cartela = cartelas[_cartelaId];
        address donoAnterior = cartela.dono;
        cartela.dono = _novoDono;

        emit DonoCartelaTransferido(_cartelaId, donoAnterior, _novoDono);
    }

    /**
     * @notice Gets the numbers array for a specific card.
     * @dev Needed because the public getter for the mapping doesn't return dynamic arrays.
     * @param _cartelaId The ID of the card.
     * @return The array of numbers for the card.
     */
    function getNumerosCartela(uint256 _cartelaId) public view cartelaExiste(_cartelaId) returns (uint[] memory) {
        return cartelas[_cartelaId].numeros;
    }
}

