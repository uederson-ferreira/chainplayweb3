async function testSelectors() {
  const rpcUrl = 'http://127.0.0.1:8545'
  const contractAddress = '0x6C8Ce2B62DB1fc444CeA525296735f94304E02D9'
  const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cfffb92266'
  
  console.log('🧪 Testando selectors calculados...\n')
  
  // Selectors calculados manualmente
  const selectors = {
    admin: '0xf851a440',           // ✅ Já confirmado que funciona
    feeCollector: '0x4ad57e3e',    // Calculado
    operadores: '0x5c975abb',      // operadores(address)
    setOperador: '0x3a3099d0',     // setOperador(address,bool)
    sortearNumero: '0x04c98c81',   // sortearNumero(uint256)
    getNumerosSorteados: '0x1c3db2e0', // getNumerosSorteados(uint256)
  }
  
  for (const [name, selector] of Object.entries(selectors)) {
    try {
      let callData = selector
      
      // Para operadores, precisa do endereço
      if (name === 'operadores') {
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
      } else {
        console.log(`✅ ${name}: ${result.result}`)
        
        if (name === 'admin' || name === 'feeCollector') {
          const address = '0x' + result.result.slice(26)
          console.log(`   Decoded: ${address}`)
        }
        
        if (name === 'operadores') {
          const isOperator = result.result === '0x0000000000000000000000000000000000000000000000000000000000000001'
          console.log(`   ${adminAddress} é operador: ${isOperator}`)
        }
      }
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`)
    }
  }
}

testSelectors()
