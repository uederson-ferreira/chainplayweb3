// ABIs gerados automaticamente do Foundry - não editar manualmente
// Gerado em: 2025-06-07T12:34:03.613Z
// Fonte: contracts/out/

export const CARTELA_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_precoBaseCartela",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_feeCollector",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "atualizarFeeCollector",
    "inputs": [
      {
        "name": "_novoFeeCollector",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "atualizarPrecoBase",
    "inputs": [
      {
        "name": "_novoPreco",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bingoGameContract",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cartelaEmUso",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cartelas",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "linhas",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "colunas",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "dono",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "numerosRegistrados",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "emUso",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "preco",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "criarCartela",
    "inputs": [
      {
        "name": "_linhas",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_colunas",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "feeCollector",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNumerosCartela",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalCartelas",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "marcarEmUso",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_emUso",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "numeroExisteNaCartela",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_numero",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "operadores",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "precoBaseCartela",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registrarNumerosCartela",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_numeros",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setBingoGameContract",
    "inputs": [
      {
        "name": "_bingoGameContract",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setOperador",
    "inputs": [
      {
        "name": "operador",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "status",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "vincularDono",
    "inputs": [
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_novoDono",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "BingoGameContractAtualizado",
    "inputs": [
      {
        "name": "bingoGameContractAnterior",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "novoBingoGameContract",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CartelaCriada",
    "inputs": [
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "donoInicial",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "linhas",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "colunas",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "preco",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CartelaMarcadaEmUso",
    "inputs": [
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "emUso",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DebugAdmin",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "feeCollector",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DonoCartelaTransferido",
    "inputs": [
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "donoAnterior",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "novoDono",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeeCollectorAtualizado",
    "inputs": [
      {
        "name": "feeCollectorAnterior",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "novoFeeCollector",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NumerosCartelaRegistrados",
    "inputs": [
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "numeros",
        "type": "uint256[]",
        "indexed": false,
        "internalType": "uint256[]"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PrecoBaseAtualizado",
    "inputs": [
      {
        "name": "precoAnterior",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "novoPreco",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const

export const BINGO_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_cartelaContractAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_vrfCoordinator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_subscriptionId",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "_keyHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_admin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_feeCollector",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "TAXA_ADMIN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "TAXA_PLATAFORMA",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "TIMEOUT_PADRAO",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancelarRodada",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_motivo",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cartelaContract",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract CartelaContract"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feeCollector",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCartelasParticipantes",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNumerosSorteados",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPremioVencedor",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_vencedor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUltimoRequestId",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVencedores",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "iniciarRodada",
    "inputs": [
      {
        "name": "_numeroMaximo",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_taxaEntrada",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_timeoutRodada",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_padroesVitoria",
        "type": "bool[]",
        "internalType": "bool[]"
      }
    ],
    "outputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "operadores",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "participar",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_cartelaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "rawFulfillRandomWords",
    "inputs": [
      {
        "name": "requestId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "randomWords",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rodadas",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "estado",
        "type": "uint8",
        "internalType": "enum BingoGameContract.EstadoRodada"
      },
      {
        "name": "numeroMaximo",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "ultimoRequestId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pedidoVrfPendente",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "premiosDistribuidos",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "taxaEntrada",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "premioTotal",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "timestampInicio",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "timeoutRodada",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setOperador",
    "inputs": [
      {
        "name": "_operador",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_status",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sortearNumero",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "requestId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verificarTimeoutRodada",
    "inputs": [
      {
        "name": "_rodadaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vrfRequestIdToRodadaId",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "AdminAtualizado",
    "inputs": [
      {
        "name": "adminAnterior",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "novoAdmin",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeeCollectorAtualizado",
    "inputs": [
      {
        "name": "feeCollectorAnterior",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "novoFeeCollector",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "JogadorEntrou",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "jogador",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "taxaPaga",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NumeroSorteado",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "numeroSorteado",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OperadorAtualizado",
    "inputs": [
      {
        "name": "operador",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "status",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PedidoVrfEnviado",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PremioDistribuido",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "vencedor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "premio",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RodadaCancelada",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "motivo",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RodadaFinalizada",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "premioTotal",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "numVencedores",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RodadaIniciada",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "numeroMaximo",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "taxaEntrada",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timeoutRodada",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VencedorEncontrado",
    "inputs": [
      {
        "name": "rodadaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "vencedor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "cartelaId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "padrao",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum BingoGameContract.PadraoVitoria"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OnlyCoordinatorCanFulfill",
    "inputs": [
      {
        "name": "have",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "want",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const
