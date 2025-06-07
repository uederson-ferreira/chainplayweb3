import React, { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Monitor,
  Play,
  Square,
  RefreshCw,
  Users,
  Trophy,
  Gamepad2,
  Wallet
} from 'lucide-react'
import { JSX } from 'react/jsx-runtime'

// Contratos usando .env
const CONTRACTS = {
  BINGO: process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS as `0x${string}`,
  CARTELA: process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS as `0x${string}`,
  VRF_COORDINATOR: process.env.NEXT_PUBLIC_VRF_COORDINATOR as `0x${string}`,
}

// Admin esperado do .env
const EXPECTED_ADMIN = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS
const EXPECTED_CHAIN_ID = process.env.NEXT_PUBLIC_NETWORK_ID

// Function selectors (ABI signatures)
const FUNCTION_SELECTORS = {
  // BingoGameContract
  operadores: '0x0db85cda',        // CORRIGIDO
  admin: '0xf851a440',
  feeCollector: '0xc415b95c',      // CORRIGIDO (estava faltando no seu)
  setOperador: '0x598ab72b',       // CORRIGIDO
  iniciarRodada: '0xab1fd7f6',     // CORRIGIDO
  sortearNumero: '0x83d3f085',     // CORRIGIDO
  rodadas: '0x19e22778',           // CORRIGIDO
  getNumerosSorteados: '0x9898d12b',
  participar: '0x8c5833bf',         // CORRIGIDO (era 0x1c... no seu)
  getVencedores: '0x1b3ff080',       // CORRIGIDO (era 0x1f...)
  getCartelasParticipantes: '0xef5150e5', // CORRIGIDO (era 0x2e...)
  cancelarRodada: '0x759035da',    // CORRIGIDO (era 0x4c...)
  
  // CartelaContract
  cartelaContract: '0xaba6df76',   // CORRIGIDO (era 0xb3...)
  criarCartela: '0x011cbb0e',      // CORRIGIDO
  registrarNumerosCartela: '0x331adf6d', // CORRIGIDO
  cartelas: '0x14d73ffb',
  getNumerosCartela: '0x94b9a23b',
  precoBaseCartela: '0x7847d950',
  cartelaEmUso: '0x2d27bc07',
  totalCartelas: '0x011cbb0e',      // ADICIONADO (nova função)
};

// Mapear estados numéricos para texto
const ESTADOS_RODADA: Record<number, string> = {
  0: 'Inativa',
  1: 'Aberta',
  2: 'Sorteando',
  3: 'Finalizada',
  4: 'Cancelada',
}

export default function VRFDebugger() {
  const { address, isConnected } = useAccount()

  // Logs
  const [logs, setLogs] = useState<string[]>(['🎯 VRF Debugger carregado...'])
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = { info: '💡', success: '✅', error: '❌', warning: '⚠️' }[type]
    setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${prefix} ${message}`])
  }

  // Status geral
  const [status, setStatus] = useState<Record<string, string>>({
    account: 'checking',
    bingo: 'checking',
    cartela: 'checking',
    operator: 'checking',
    vrf: 'checking',
    admin: 'checking',
    env: 'checking',
  })

  // Roles: admin() e operadores(msg.sender)
  const [roles, setRoles] = useState<{ admin: string; isOperator: boolean }>({
    admin: 'Carregando…',
    isOperator: false,
  })

  // Informação extraída pelo checkPermissions
  const [contractInfo, setContractInfo] = useState({
    bingoAdmin: 'Verificando...',
    bingoFeeCollector: 'Verificando...',
    cartelaFeeCollector: 'Verificando...',
    cartelaAdmin: 'Verificando...',
    isOperator: false,
    isBingoAdmin: false,
    isCartelaAdmin: false,
  })

  // Dados da rodada
  const [selectedRound, setSelectedRound] = useState('0')
  const [roundData, setRoundData] = useState<{
    id: number
    estado: string
    numeroMaximo: number
    numerosSorteados: number[]
    cartelasParticipantes: any[]
    vencedores: any[]
    taxaEntrada: string
    premioTotal: string
    timestampInicio: number
    timeoutRodada: number
    vrfPendente: boolean
    ultimoRequestId: number
  }>({
    id: 0,
    estado: 'Verificando...',
    numeroMaximo: 0,
    numerosSorteados: [],
    cartelasParticipantes: [],
    vencedores: [],
    taxaEntrada: '0',
    premioTotal: '0',
    timestampInicio: 0,
    timeoutRodada: 0,
    vrfPendente: false,
    ultimoRequestId: 0,
  })

  // Dados das cartelas
  const [cartelaData, setCartelaData] = useState({
    precoBase: '0',
    totalCartelas: 0,
    minhasCartelas: [] as number[],
  })

  // Parâmetros de teste
  const [testParams, setTestParams] = useState({
    maxNumeros: '75',
    taxaEntrada: '0.01',
    timeoutHoras: '1',
    premios: {
      linha: true,
      coluna: true,
      diagonal: true,
      cartela: false,
    },
  })

  // Monitoramento VRF
  const [isMonitoring, setIsMonitoring] = useState(false)
  const monitoringRef = useRef<NodeJS.Timeout | null>(null)

  // -------------- Ethereum Helpers ----------------

  const checkEthereumProvider = () => {
    if (!(window as any).ethereum) {
      addLog('❌ MetaMask não detectado', 'error')
      return false
    }
    return true
  }

  // --- Funções Transacionais (CONTINUAÇÃO) ---
  const createCard = async () => {
      if (!isConnected || !address) {
        addLog('❌ Conecte a carteira primeiro.', 'error');
        return;
      }
      if (!(window as any).ethereum || !(await checkNetwork())) return;

      try {
        addLog('🔄 Criando cartela 5x5...', 'info');

        // --- CORREÇÃO AQUI ---
        // Vamos usar o valor correto diretamente, que é 0.01 ETH.
        // 0.01 ETH = 1 * 10^16 Wei.
        const precoEmWei = 10000000000000000; // 0.01 ETH em Wei

        const functionSelector = '0x011cbb0e'; // Seletor para criarCartela(uint8, uint8)
        const linhas = (5).toString(16).padStart(64, '0');
        const colunas = (5).toString(16).padStart(64, '0');
        const data = `${functionSelector}${linhas}${colunas}`;

        const tx: string = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACTS.CARTELA,
            value: '0x' + precoEmWei.toString(16), // Enviando 0.01 ETH
            data,
            gas: '0x7A120',
          }],
        });

        addLog(`✅ Tx de criação de cartela enviada: ${tx}`, 'success');
        addLog('⚠️ Aguardando confirmação... Atualize os dados em breve.', 'warning');
        setTimeout(fetchCartelaData, 10000);
      } catch (err: any) {
        addLog(`❌ Erro ao criar cartela: ${err.message}`, 'error');
      }
  }

  const checkNetwork = async () => {
    if (!checkEthereumProvider()) return false
    try {
      const chainId: string = await (window as any).ethereum.request({ method: 'eth_chainId' })
      const expected = `0x${parseInt(EXPECTED_CHAIN_ID || '0').toString(16)}`
      if (chainId !== expected) {
        addLog(`❌ Rede incorreta. Esperado ${expected}, atual ${chainId}`, 'error')
        return false
      }
      addLog(`✅ Rede correta: ${chainId}`, 'success')
      return true
    } catch (err: any) {
      addLog(`Erro ao verificar rede: ${err.message}`, 'error')
      return false
    }
  }

  // --- 1) Config .env ---
  const checkEnvConfig = () => {
    addLog('🔧 Verificando .env...', 'info')
    let ok = true
    if (!CONTRACTS.BINGO) { addLog('❌ BINGO_ADDRESS ausente', 'error'); ok = false }
    if (!CONTRACTS.CARTELA) { addLog('❌ CARTELA_ADDRESS ausente', 'error'); ok = false }
    if (!EXPECTED_ADMIN) { addLog('❌ OPERATOR_ADDRESS ausente', 'error'); ok = false }
    if (!EXPECTED_CHAIN_ID) { addLog('❌ NETWORK_ID ausente', 'error'); ok = false }
    setStatus(s => ({ ...s, env: ok ? 'success' : 'error' }))
    return ok
  }

  // --- 2) Check contracts deployed ---
  const checkContracts = async () => {
    if (!checkEthereumProvider() || !(await checkNetwork())) return
    try {
      addLog('🔍 Verificando contratos...', 'info')
      const bingoCode: string = await (window as any).ethereum.request({
        method: 'eth_getCode',
        params: [CONTRACTS.BINGO, 'latest'],
      })
      const okBingo = bingoCode && bingoCode !== '0x'
      setStatus(s => ({ ...s, bingo: okBingo ? 'success' : 'error' }))

      const cartelaCode: string = await (window as any).ethereum.request({
        method: 'eth_getCode',
        params: [CONTRACTS.CARTELA, 'latest'],
      })
      const okCartela = cartelaCode && cartelaCode !== '0x'
      setStatus(s => ({ ...s, cartela: okCartela ? 'success' : 'error' }))

      if (CONTRACTS.VRF_COORDINATOR) {
        const vrfCode: string = await (window as any).ethereum.request({
          method: 'eth_getCode',
          params: [CONTRACTS.VRF_COORDINATOR, 'latest'],
        })
        const okVrf = vrfCode && vrfCode !== '0x'
        setStatus(s => ({ ...s, vrf: okVrf ? 'success' : 'warning' }))
      }

      addLog(`Contrato Bingo: ${okBingo ? 'OK' : 'Erro'}`, okBingo ? 'success' : 'error')
      addLog(`Contrato Cartela: ${okCartela ? 'OK' : 'Erro'}`, okCartela ? 'success' : 'error')
    } catch (err: any) {
      addLog(`Erro contratos: ${err.message}`, 'error')
    }
  }

  // --- 3) Permissões e roles ---
  const checkPermissions = async () => {
    if (!isConnected || !address || !(window as any).ethereum) return
    if (!(await checkNetwork())) return

    try {
      addLog('🔍 Verificando permissões...', 'info')
      // admin()
      const bingoAdminHex: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.BINGO, data: FUNCTION_SELECTORS.admin }, 'latest'],
      })
      const bingoAdmin = '0x' + bingoAdminHex.slice(-40)

      // feeCollector()
      const bingoFeeHex: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.BINGO, data: FUNCTION_SELECTORS.feeCollector }, 'latest'],
      })
      const bingoFee = '0x' + bingoFeeHex.slice(-40)

      // operadores(address)
      const opData = FUNCTION_SELECTORS.operadores + address.slice(2).padStart(64, '0')
      const opHex: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.BINGO, data: opData }, 'latest'],
      })
      const isOp = opHex.endsWith('1')

      // cartela feeCollector
      const cartelaFeeHex: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.CARTELA, data: FUNCTION_SELECTORS.feeCollector }, 'latest'],
      })
      const cartelaFee = '0x' + cartelaFeeHex.slice(-40)

      // Determine admin flags
      const isBingoAdmin = bingoAdmin.toLowerCase() === address.toLowerCase() || bingoFee.toLowerCase() === address.toLowerCase()
      const isCartelaAdmin = cartelaFee.toLowerCase() === address.toLowerCase()

      setContractInfo({
        bingoAdmin,
        bingoFeeCollector: bingoFee,
        cartelaFeeCollector: cartelaFee,
        cartelaAdmin: cartelaFee,
        isOperator: isOp,
        isBingoAdmin,
        isCartelaAdmin,
      })

      setStatus(s => ({
        ...s,
        operator: isOp ? 'success' : 'error',
        admin: (isBingoAdmin || isCartelaAdmin) ? 'success' : 'error',
      }))

      addLog(`Operador autorizado: ${isOp ? 'Sim' : 'Não'}`, isOp ? 'success' : 'error')
      addLog(`Você é Admin Bingo: ${isBingoAdmin ? 'Sim' : 'Não'}`, isBingoAdmin ? 'success' : 'warning')
      addLog(`Você é Admin Cartela: ${isCartelaAdmin ? 'Sim' : 'Não'}`, isCartelaAdmin ? 'success' : 'warning')
    } catch (err: any) {
      addLog(`Erro permissões: ${err.message}`, 'error')
    }
  }

  // fetchRoles: extrai admin() e operadores(msg.sender)
const fetchRoles = async () => {
  if (!(window as any).ethereum || !address) return;
  try {
    addLog('🔄 Extraindo roles...', 'info');

    // chama admin()
    const adminHex: string = await (window as any).ethereum.request({
      method: 'eth_call',
      params: [{ to: CONTRACTS.BINGO, data: FUNCTION_SELECTORS.admin }, 'latest'],
    });
    // pega os últimos 40 hexas como endereço
    const adminAddr = '0x' + adminHex.slice(-40);

    // chama operadores(address)
    const opData = FUNCTION_SELECTORS.operadores + address.slice(2).padStart(64, '0');
    const opHex: string = await (window as any).ethereum.request({
      method: 'eth_call',
      params: [{ to: CONTRACTS.BINGO, data: opData }, 'latest'],
    });
    // se o retorno terminar em '1', é true
    const isOp = opHex.endsWith('1');

    setRoles({ admin: adminAddr, isOperator: isOp });
    addLog(`Admin extraído: ${adminAddr}`, 'success');
    addLog(`Você é operador: ${isOp ? '✅ Sim' : '❌ Não'}`, isOp ? 'success' : 'error');
  } catch (err: any) {
    addLog(`Erro fetchRoles: ${err.message}`, 'error');
  }
};


  // --- 4) Dados da rodada ---
  const fetchRoundData = async (roundId: string) => {
    if (!checkEthereumProvider() || !(await checkNetwork())) return
    try {
      addLog(`🔄 Buscando rodada ${roundId}...`, 'info')
      const callData = FUNCTION_SELECTORS.rodadas + roundId.padStart(64, '0')
      const res: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.BINGO, data: callData }, 'latest'],
      })
      if (!res || res.length < 66) return

      const id = parseInt(res.slice(2, 66), 16)
      const estadoNum = parseInt(res.slice(66, 130), 16)
      const numeroMax = parseInt(res.slice(130, 194), 16)
      const ultimoRequestId = parseInt(res.slice(194, 258), 16)
      const vrfPend = res.slice(258, 322) !== '0'.repeat(64)
      const taxa = parseInt(res.slice(386, 450), 16)
      const premio = parseInt(res.slice(450, 514), 16)
      const tsInicio = parseInt(res.slice(514, 578), 16)
      const timeout = parseInt(res.slice(578, 642), 16)

      // getNumerosSorteados
      const numsCall = FUNCTION_SELECTORS.getNumerosSorteados + roundId.padStart(64, '0')
      const numsRes: string = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACTS.BINGO, data: numsCall }, 'latest'],
      })
      let arr: number[] = []
      if (numsRes && numsRes.length > 130) {
        const len = parseInt(numsRes.slice(66, 130), 16)
        for (let i = 0; i < len; i++) {
          const numHex = numsRes.slice(130 + i*64, 130 + (i+1)*64)
          arr.push(parseInt(numHex, 16))
        }
      }

      setRoundData({
        id,
        estado: ESTADOS_RODADA[estadoNum] || 'Desconhecido',
        numeroMaximo: numeroMax,
        numerosSorteados: arr,
        cartelasParticipantes: [],
        vencedores: [],
        taxaEntrada: (taxa / 1e18).toString(),
        premioTotal: (premio / 1e18).toString(),
        timestampInicio: tsInicio,
        timeoutRodada: timeout,
        vrfPendente: vrfPend,
        ultimoRequestId,
      })
      addLog(`Rodada ${id}: ${ESTADOS_RODADA[estadoNum]}`, 'success')
      addLog(`Números: [${arr.join(', ')}]`, 'info')
    } catch (err: any) {
      addLog(`Erro fetchRoundData: ${err.message}`, 'error')
    }
  }

  // --- 5) Dados Cartela ---
  const fetchCartelaData = async () => {
      if (!checkEthereumProvider() || !(await checkNetwork()) || !address) return;
      try {
          addLog('🔄 Buscando dados de cartela...', 'info');

          // 1. Preço Base (sem alteração)
          const precoRes: string = await (window as any).ethereum.request({
              method: 'eth_call',
              params: [{ to: CONTRACTS.CARTELA, data: '0x7847d950' /* precoBaseCartela() */ }, 'latest'],
          });
          const preco = parseInt(precoRes, 16) / 1e18;

          // 2. Total de Cartelas (usando a NOVA função)
          const totalRes: string = await (window as any).ethereum.request({
              method: 'eth_call',
              params: [{ to: CONTRACTS.CARTELA, data: '0xd94b6851' /* getTotalCartelas() */ }, 'latest'],
          });
          const total = parseInt(totalRes, 16);
          
          // 3. Gerar a lista de IDs das "suas" cartelas
          // A lógica simplificada para o debugger continua válida e segura
          const minhasCartelasIds = Array.from({ length: total }, (_, i) => i);
          
          setCartelaData({
              precoBase: preco.toString(),
              totalCartelas: total,
              minhasCartelas: minhasCartelasIds,
          });

          addLog(`✅ Dados de Cartela: Preço ${preco} ETH, Total ${total}, Suas ${minhasCartelasIds.length}`, 'success');

      } catch (err: any) {
          addLog(`❌ Erro em fetchCartelaData: ${err.message}`, 'error');
      }
  }

  // --- 6) Operações Transacionais ---
  const addAsOperator = async () => {
    if (!isConnected || !address) return
    if (!contractInfo.isBingoAdmin) {
      addLog('❌ Precisa ser Admin para adicionar operador', 'error')
      return
    }
    if (!(window as any).ethereum || !(await checkNetwork())) return

    try {
      addLog('🔄 Adicionando operador...', 'info')
      const data =
        FUNCTION_SELECTORS.setOperador +
        address.slice(2).padStart(64, '0') +
        '0'.repeat(63) + '1'

      const tx: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: CONTRACTS.BINGO, data, gas: '0x30D40' }],
      })
      addLog(`Tx enviada: ${tx}`, 'success')
      setTimeout(checkPermissions, 5000)
    } catch (err: any) {
      addLog(`Erro addAsOperator: ${err.message}`, 'error')
    }
  }

  const createTestRound = async () => {
    if (!isConnected || !address || !contractInfo.isOperator) {
      addLog('❌ Precisa ser operador para criar rodada', 'error')
      return
    }
    if (!(window as any).ethereum || !(await checkNetwork())) return

    try {
      addLog('🔄 Criando rodada...', 'info')
      const maxN = parseInt(testParams.maxNumeros)
      const taxaHex = Math.floor(parseFloat(testParams.taxaEntrada) * 1e18).toString(16)
      const timeoutSec = Math.floor(parseFloat(testParams.timeoutHoras) * 3600)

      const patterns = Object.values(testParams.premios).map(b => b ? '1' : '0')
      const header =
        FUNCTION_SELECTORS.iniciarRodada +
        maxN.toString(16).padStart(64, '0') +
        taxaHex.padStart(64, '0') +
        timeoutSec.toString(16).padStart(64, '0') +
        '0'.repeat(126) + '80' + // dynamic array offset
        '0'.repeat(126) + '04'   // length = 4
      const tail = patterns.map((p) => p.padStart(64, '0')).join('')

      const tx: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: CONTRACTS.BINGO, data: header + tail, gas: '0x7A120' }],
      })
      addLog(`Rodada criada: ${tx}`, 'success')
      setTimeout(() => fetchRoundData(selectedRound), 5000)
    } catch (err: any) {
      addLog(`Erro createTestRound: ${err.message}`, 'error')
    }
  }

  const drawNumber = async () => {
    if (!isConnected || !address || !contractInfo.isOperator) {
      addLog('❌ Precisa ser operador para sortear', 'error')
      return
    }
    if (!(window as any).ethereum || !(await checkNetwork())) return

    try {
      addLog(`🔄 Sortear nº [rodada ${selectedRound}]`, 'info')
      const data = FUNCTION_SELECTORS.sortearNumero + selectedRound.padStart(64, '0')
      const tx: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: CONTRACTS.BINGO, data, gas: '0x7A120' }],
      })
      addLog(`Tx sorteio: ${tx}`, 'success')
      if (!isMonitoring) startMonitoring()
    } catch (err: any) {
      addLog(`Erro drawNumber: ${err.message}`, 'error')
    }
  }

  // --- 7) Monitoramento automático ---
  const startMonitoring = () => {
    if (monitoringRef.current) clearInterval(monitoringRef.current)
    setIsMonitoring(true)
    addLog('📊 Iniciando monitoramento...', 'info')
    monitoringRef.current = setInterval(() => fetchRoundData(selectedRound), 3000)
  }
  const stopMonitoring = () => {
    if (monitoringRef.current) clearInterval(monitoringRef.current)
    monitoringRef.current = null
    setIsMonitoring(false)
    addLog('⏹️ Monitor parado', 'info')
  }

  // --- 8) Refresh tudo ---
  const refreshAll = async () => {
    addLog('🔄 Refresh geral...', 'info')
    if (!checkEnvConfig()) return
    if (!checkEthereumProvider() || !(await checkNetwork())) return

    setStatus(s => ({ ...s, account: 'success' }))
    await checkContracts()
    await checkPermissions()
    await fetchRoundData(selectedRound)
    await fetchCartelaData()
    addLog('✅ Tudo atualizado', 'success')
  }

  // --------------- Effects ----------------

  // Ao conectar carteira, extrai roles
  useEffect(() => {
    if (isConnected) {
      fetchRoles()
    }
  }, [isConnected])

  // Inicialização MetaMask & refreshAll
  useEffect(() => {
    const init = async () => {
      checkEnvConfig()
      if ((window as any).ethereum) {
        addLog('✅ MetaMask detectado', 'success')
        if (isConnected) await refreshAll()
      } else {
        window.addEventListener('ethereum#initialized', async () => {
          addLog('✅ MetaMask inicializado', 'success')
          if (isConnected) await refreshAll()
        }, { once: true })
        setTimeout(() => {
          if ((window as any).ethereum) {
            addLog('✅ MetaMask detectado (fallback)', 'success')
            if (isConnected) refreshAll()
          } else {
            addLog('❌ MetaMask não detectado', 'error')
          }
        }, 1000)
      }
    }
    init()
  }, [isConnected])

  // Sempre que mudar rodada selecionada
  useEffect(() => {
    if (isConnected && selectedRound) {
      fetchRoundData(selectedRound)
    }
  }, [selectedRound])

  // Cleanup monitor
  useEffect(() => {
    return () => {
      if (monitoringRef.current) clearInterval(monitoringRef.current)
    }
  }, [])

  // Status badge helper
  function StatusBadge({ status, label }: { status: string; label: string }) {
    const variants: Record<string, string> = {
      checking: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    }
    const icons: Record<string, JSX.Element> = {
      checking: <Clock className="h-3 w-3" />,
      success: <CheckCircle className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />,
      warning: <AlertCircle className="h-3 w-3" />,
    }
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-slate-300">{label}:</span>
        <Badge className={`${variants[status]} flex items-center gap-1`}>
          {icons[status]}
          {status === 'checking' ? 'Verificando...' :
           status === 'success' ? 'OK' :
           status === 'error' ? 'Erro' : 'Aviso'}
        </Badge>
      </div>
    )
  }

  // ------------------- JSX -------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            🎲 VRF Debugger Pro
          </h1>
          <p className="text-slate-400">Diagnóstico completo e teste do sistema de Bingo</p>
          {/* Quick Status */}
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            {Object.entries(status).map(([k,v]) => (
              <Badge key={k} className={
                v === 'success' ? 'bg-green-500/20 text-green-400' :
                v === 'error'   ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
              }>
                {k}: {v === 'success' ? '✅' : v === 'error' ? '❌' : '⏳'}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="diagnosis" className="space-y-6">
          <TabsList className="grid grid-cols-6 bg-slate-800">
            <TabsTrigger value="diagnosis" className="text-white">🔍 Diagnóstico</TabsTrigger>
            <TabsTrigger value="permissions" className="text-white">🛡️ Permissões</TabsTrigger>
            <TabsTrigger value="rounds" className="text-white">🎮 Rodadas</TabsTrigger>
            <TabsTrigger value="cartelas" className="text-white">🎯 Cartelas</TabsTrigger>
            <TabsTrigger value="test" className="text-white">🧪 Teste VRF</TabsTrigger>
            <TabsTrigger value="monitor" className="text-white">📊 Monitor</TabsTrigger>
          </TabsList>

          {/* Diagnóstico */}
          <TabsContent value="diagnosis" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-400" /> Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusBadge status={status.env}    label="🔧 .env" />
                  <StatusBadge status={status.account}label="👤 Conta" />
                  <StatusBadge status={status.bingo}  label="🎮 Bingo" />
                  <StatusBadge status={status.cartela}label="🎯 Cartela" />
                  <StatusBadge status={status.vrf}    label="🎲 VRF" />
                  <StatusBadge status={status.operator}label="🛡️ Operador" />
                  <StatusBadge status={status.admin}  label="👑 Admin" />
                  <div className="pt-4">
                    <Button onClick={refreshAll} className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Tudo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-400" /> Configuração Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400">🎮 Bingo:</p>
                    <p className="font-mono text-xs break-all text-slate-300">{CONTRACTS.BINGO}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">🎯 Cartela:</p>
                    <p className="font-mono text-xs break-all text-slate-300">{CONTRACTS.CARTELA}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">👑 Admin Esperado:</p>
                    <p className="font-mono text-xs text-slate-300">{EXPECTED_ADMIN}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">🌐 Chain ID:</p>
                    <p className="font-mono text-slate-300">{EXPECTED_CHAIN_ID}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">👤 Sua Conta:</p>
                    <p className="font-mono text-xs break-all text-slate-300">{address || 'Não conectada'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Permissões */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bingo Contract */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-400" /> Permissões Bingo
                  </CardTitle>
                  <Button onClick={fetchRoles} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    🔄 Extrair Permissões
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm">👑 Admin (via admin())</p>
                    <p className="font-mono text-xs break-all text-slate-300">{roles.admin}</p>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-slate-400 text-sm">🛡️ É Operador?</p>
                    <Badge className={roles.isOperator ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {roles.isOperator ? 'Sim ✅' : 'Não ❌'}
                    </Badge>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={addAsOperator}
                      disabled={!contractInfo.isBingoAdmin || roles.isOperator}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                    >
                      {roles.isOperator ? '✅ Já é Operador' : '🛡️ Adicionar Operador'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Cartela Contract */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-purple-400" /> Permissões Cartela
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm">💰 Fee Collector/Admin</p>
                    <p className="font-mono text-xs break-all text-slate-300">{contractInfo.cartelaFeeCollector}</p>
                    <Badge className={contractInfo.isCartelaAdmin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {contractInfo.isCartelaAdmin ? 'Sim ✅' : 'Não ❌'}
                    </Badge>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-slate-400 text-sm">💎 Preço Base Cartela</p>
                    <p className="font-bold text-white">{cartelaData.precoBase} ETH</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-200 text-sm">
                      💡 Para criar cartelas você paga a taxa base.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rodadas */}
          <TabsContent value="rounds" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Criar Rodada */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-cyan-400" /> Criar Rodada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Número Máximo</Label>
                      <Input
                        type="number"
                        min={10}
                        max={99}
                        value={testParams.maxNumeros}
                        onChange={e => setTestParams(tp => ({ ...tp, maxNumeros: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Taxa Entrada (ETH)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={testParams.taxaEntrada}
                        onChange={e => setTestParams(tp => ({ ...tp, taxaEntrada: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Timeout (h)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0.5}
                      max={24}
                      value={testParams.timeoutHoras}
                      onChange={e => setTestParams(tp => ({ ...tp, timeoutHoras: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Padrões de Vitória</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(testParams.premios).map(([key,val]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={e => setTestParams(tp => ({
                              ...tp,
                              premios: { ...tp.premios, [key]: e.target.checked }
                            }))}
                            className="rounded bg-slate-700 border-slate-600"
                          />
                          <span className="text-slate-300 capitalize text-sm">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={createTestRound}
                    disabled={!contractInfo.isOperator}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <Play className="h-4 w-4 mr-2" /> Criar
                  </Button>
                </CardContent>
              </Card>

              {/* Dados da Rodada */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" /> Dados da Rodada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">ID Rodada</Label>
                    <Input
                      type="number"
                      value={selectedRound}
                      min={0}
                      onChange={e => setSelectedRound(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Estado</p>
                      <p className="text-white font-semibold">{roundData.estado}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Máximo</p>
                      <p className="text-white font-semibold">{roundData.numeroMaximo}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Taxa</p>
                      <p className="text-white font-semibold">{roundData.taxaEntrada} ETH</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Prêmio</p>
                      <p className="text-white font-semibold">{roundData.premioTotal} ETH</p>
                    </div>
                    <div>
                      <p className="text-slate-400">VRF Pendente</p>
                      <Badge className={roundData.vrfPendente ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                        {roundData.vrfPendente ? 'Sim ⏳' : 'Não ✅'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400">Request ID</p>
                      <p className="font-mono text-white">{roundData.ultimoRequestId || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Números Sorteados</p>
                    <div className="bg-slate-700 rounded-lg p-3 min-h-[60px] flex flex-wrap gap-2">
                      {roundData.numerosSorteados.length > 0
                        ? roundData.numerosSorteados.map((n, i) => (
                          <Badge key={i} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                            {n}
                          </Badge>
                        ))
                        : <p className="text-slate-500 w-full text-center">Nenhum número</p>
                      }
                    </div>
                  </div>
                  <Button
                    onClick={() => fetchRoundData(selectedRound)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Dados
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cartelas */}
          <TabsContent value="cartelas" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Criar Cartela */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-400" /> Criar Cartela 5x5
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-200 text-sm mb-2"><strong>💰 Custo:</strong> {cartelaData.precoBase} ETH</p>
                    <p className="text-blue-300 text-xs">Dimensões: 5 linhas x 5 colunas</p>
                  </div>
                  <Button
                    onClick={createCard} //onClick={() => { /* ... chamar create cartela */ }}
                    disabled={!isConnected}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500"
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Criar 5x5
                  </Button>
                  <p className="text-xs text-slate-400">⚠️ Após criar, registrar números via outra chamada.</p>
                </CardContent>
              </Card>

              {/* Info Cartelas */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-400" /> Info Cartelas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400">💎 Preço Base</p>
                    <p className="text-white font-bold text-lg">{cartelaData.precoBase} ETH</p>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-slate-400">📊 Total de Cartelas</p>
                    <p className="text-white font-semibold">{cartelaData.totalCartelas}</p>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-slate-400">🎯 Suas Cartelas (IDs)</p>
                    <p className="text-white font-semibold break-all">
                      {cartelaData.minhasCartelas.length > 0 ? cartelaData.minhasCartelas.join(', ') : 'Nenhuma'}
                    </p>
                  </div>
                  <Button
                    onClick={fetchCartelaData}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Cartelas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teste VRF */}
          <TabsContent value="test" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-400" /> Teste VRF Completo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    onClick={drawNumber}
                    disabled={!contractInfo.isOperator || roundData.estado !== 'Aberta'}
                    className="bg-gradient-to-r from-green-500 to-teal-500"
                  >
                    <Play className="h-4 w-4 mr-2" /> Sortear Nº
                  </Button>
                  <Button
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    className={isMonitoring
                      ? "bg-gradient-to-r from-red-500 to-pink-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }
                  >
                    {isMonitoring
                      ? <><Square className="h-4 w-4 mr-2" /> Parar Monitor</>
                      : <><Monitor className="h-4 w-4 mr-2" /> Iniciar Monitor</>
                    }
                  </Button>
                  <Button
                    onClick={() => fetchRoundData(selectedRound)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                  </Button>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-200 font-semibold mb-2">🎯 Status Teste VRF</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Rodada</p>
                      <p className="text-white font-bold">{selectedRound}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Estado</p>
                      <Badge className={
                        roundData.estado === 'Aberta'   ? 'bg-green-500/20 text-green-400' :
                        roundData.estado === 'Sorteando'? 'bg-yellow-500/20 text-yellow-400' :
                        roundData.estado === 'Finalizada'? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }>
                        {roundData.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400">VRF Pendente</p>
                      <Badge className={roundData.vrfPendente ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                        {roundData.vrfPendente ? 'Sim ⏳' : 'Não ✅'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400">Números</p>
                      <p className="text-white font-bold">{roundData.numerosSorteados.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-200 font-medium mb-2">💡 Instruções:</p>
                  <ol className="text-blue-300 text-sm space-y-1">
                    <li>1. Ser operador</li>
                    <li>2. Criar/usar rodada</li>
                    <li>3. Sortear Nº</li>
                    <li>4. Monitorar resposta</li>
                    <li>5. Verificar resultado</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Status Real-time */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-cyan-400" /> Monitoramento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge className={isMonitoring ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                      {isMonitoring ? '🟢 Ativo' : '🔴 Parado'}
                    </Badge>
                  </div>
                  <div className="space-y-3 text-xs">
                    <p>Rodada: <span className="font-mono">{selectedRound}</span></p>
                    <p>Estado: <span className="font-semibold">{roundData.estado}</span></p>
                    <p>Request ID: <span className="font-mono">{roundData.ultimoRequestId || 'N/A'}</span></p>
                    <p>Última: <span className="font-mono">{new Date().toLocaleTimeString()}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={startMonitoring} disabled={isMonitoring} size="sm" className="flex-1 bg-green-600">
                      ▶️ Start
                    </Button>
                    <Button onClick={stopMonitoring} disabled={!isMonitoring} size="sm" variant="outline" className="flex-1">
                      ⏹️ Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Logs */}
              <Card className="md:col-span-2 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">📊 Log de Atividades</span>
                    <Button onClick={() => setLogs(['🎯 Logs limpos...'])} size="sm" variant="outline">
                      🗑️ Limpar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
                    {logs.map((l,i) => (
                      <div key={i} className={
                        l.includes('✅') ? 'text-green-400' :
                        l.includes('❌') ? 'text-red-400' :
                        l.includes('⚠️') ? 'text-yellow-400' :
                        'text-slate-300'
                      }>
                        {l}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
