export const CARTELA_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "CartelaInexistente",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "NaoEhDono",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "NumerosJaRegistrados",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "QuantidadeNumerosInvalida",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "cartelaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "dono",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "linhas",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "colunas",
        type: "uint8",
      },
    ],
    name: "CartelaCriada",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "cartelaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "dono",
        type: "address",
      },
    ],
    name: "NumerosRegistrados",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "cartelaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "donoAntigo",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "donoNovo",
        type: "address",
      },
    ],
    name: "PropriedadeTransferida",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "cartelas",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "linhas",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "colunas",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "dono",
        type: "address",
      },
      {
        internalType: "bool",
        name: "numerosRegistrados",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_linhas",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "_colunas",
        type: "uint8",
      },
    ],
    name: "criarCartela",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "getNumerosCartela",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proximoCartelaId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "_numeros",
        type: "uint256[]",
      },
    ],
    name: "registrarNumerosCartela",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_novoDono",
        type: "address",
      },
    ],
    name: "vincularDono",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export const BINGO_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_cartelaContractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_vrfCoordinator",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "_subscriptionId",
        type: "uint64",
      },
      {
        internalType: "bytes32",
        name: "_keyHash",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "cartelaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "jogador",
        type: "address",
      },
    ],
    name: "JogadorEntrou",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "numeroSorteado",
        type: "uint256",
      },
    ],
    name: "NumeroSorteado",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    name: "PedidoVrfEnviado",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalPrize",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "winnerCount",
        type: "uint256",
      },
    ],
    name: "PremioDistribuido",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
    ],
    name: "RodadaFinalizada",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "numeroMaximo",
        type: "uint8",
      },
    ],
    name: "RodadaIniciada",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "vencedor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "cartelaId",
        type: "uint256",
      },
    ],
    name: "VencedorEncontrado",
    type: "event",
  },
  {
    inputs: [],
    name: "cartelaContract",
    outputs: [
      {
        internalType: "contract CartelaContract",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rodadaId",
        type: "uint256",
      },
    ],
    name: "distribuirPremios",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_numeroMaximo",
        type: "uint8",
      },
    ],
    name: "iniciarRodada",
    outputs: [
      {
        internalType: "uint256",
        name: "rodadaId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rodadaId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_cartelaId",
        type: "uint256",
      },
    ],
    name: "participar",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "rodadas",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "enum BingoGameContract.EstadoRodada",
        name: "estado",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "numeroMaximo",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "ultimoRequestId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "pedidoVrfPendente",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "premiosDistribuidos",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rodadaId",
        type: "uint256",
      },
    ],
    name: "sortearNumero",
    outputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "vrfRequestIdToRodadaId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const
