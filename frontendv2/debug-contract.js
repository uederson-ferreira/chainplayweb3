async function debugContract() {
  const rpcUrl = 'http://127.0.0.1:8545'
  const contractAddress = '0x6C8Ce2B62DB1fc444CeA525296735f94304E02D9'
  
  console.log('🔍 Testando selectors corretos do BingoGameContract...\n')
  
  // Function selectors corretos baseados no código
  const selectorsToTest = [
    // Getters automáticos das variáveis públicas
    { name: 'admin()', selector: '0xf851a440' },
    { name: 'feeCollector()', selector: '0x4ad57e3e' },
    
    // Mapping getter - operadores(address)
    { name: 'operadores(address)', selector: '0x5c975abb', needsAddress: true },
    
    // Outros getters de variáveis públicas
    { name: 'TAXA_ADMIN()', selector: '0x70897b23' },
    { name: 'TAXA_PLATAFORMA()', selector: '0x91b7f5ed' },
    { name: 'cartelaContract()', selector: '0x4f0cd27b' },
  ]
  
  const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  
  try {
    for (const { name, selector, needsAddress } of selectorsToTest) {
      try {
        let callData = selector
        
        // Se precisa de endereço (para mappings)
        if (needsAddress) {
          callData = selector + '000000000000000000000000' + adminAddress.slice(2).toLowerCase()
        }
        
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: callData
            }, 'latest'],
            id: 1
          })
        })
        
        const result = await response.json()
        
        if (result.error) {
          console.log(`❌ ${name}: ${result.error.message}`)
        } else if (result.result && result.result !== '0x') {
          console.log(`✅ ${name}: ${result.result}`)
          
          // Decodificar address se parece com um
          if (result.result.length === 66 && !needsAddress) {
            const address = '0x' + result.result.slice(26)
            console.log(`   Decoded address: ${address}`)
          }
          
          // Para mappings boolean
          if (needsAddress) {
            const isTrue = result.result === '0x0000000000000000000000000000000000000000000000000000000000000001'
            console.log(`   ${adminAddress} é operador: ${isTrue}`)
          }
        }
      } catch (e) {
        console.log(`❌ ${name}: ${e.message}`)
      }
    }
    
    // Calcular selector para setOperador
    console.log('\n🔧 Calculando selector para setOperador...')
    const keccak256 = require('crypto').createHash('sha256')
    
    // Simular keccak256("setOperador(address,bool)".slice(0,4))
    // Na verdade, vamos tentar alguns selectors comuns
    const setOperadorSelectors = [
      '0x5c975abb', // possível
      '0x3a3099d0', // possível  
      '0x1e83409a', // possível
      '0x7adbf973', // possível
    ]
    
    console.log('Testando possíveis selectors para setOperador...')
    for (const selector of setOperadorSelectors) {
      const callData = selector + 
        '000000000000000000000000' + adminAddress.slice(2).toLowerCase() + // address
        '0000000000000000000000000000000000000000000000000000000000000001'   // true
      
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: callData
            }, 'latest'],
            id: 2
          })
        })
        
        const result = await response.json()
        console.log(`Selector ${selector}: ${result.error ? 'ERRO - ' + result.error.message : 'SUCESSO'}`)
      } catch (e) {
        console.log(`Selector ${selector}: ERRO - ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

debugContract()
