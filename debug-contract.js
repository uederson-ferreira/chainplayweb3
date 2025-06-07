async function debugContract() {
  const rpcUrl = 'http://127.0.0.1:8545'
  const contractAddress = '0x6C8Ce2B62DB1fc444CeA525296735f94304E02D9'
  
  console.log('🔍 Debugando contrato...\n')
  
  try {
    // 1. Verificar se Anvil responde
    const chainResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    })
    
    const chainResult = await chainResponse.json()
    console.log('🌐 Chain ID:', chainResult.result)
    
    // 2. Verificar se contrato existe
    const codeResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [contractAddress, 'latest'],
        id: 2
      })
    })
    
    const codeResult = await codeResponse.json()
    console.log('📝 Contrato existe:', codeResult.result !== '0x')
    console.log('📝 Tamanho do código:', codeResult.result.length)
    
    // 3. Testar diferentes function selectors
    const selectors = [
      { name: 'owner()', selector: '0x8da5cb5b' },
      { name: 'feeCollector()', selector: '0x4ad57e3e' },
      { name: 'isOperador(address)', selector: '0x13e7c9d8' },
    ]
    
    for (const { name, selector } of selectors) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: selector
            }, 'latest'],
            id: 3
          })
        })
        
        const result = await response.json()
        
        if (result.error) {
          console.log(`❌ ${name}: ${result.error.message}`)
        } else {
          console.log(`✅ ${name}: ${result.result}`)
        }
      } catch (e) {
        console.log(`❌ ${name}: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

debugContract()