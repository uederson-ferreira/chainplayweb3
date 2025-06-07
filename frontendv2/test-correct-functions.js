async function testCorrectFunctions() {
  const rpcUrl = 'http://127.0.0.1:8545'
  const contractAddress = '0x6C8Ce2B62DB1fc444CeA525296735f94304E02D9'
  const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cfffb92266'
  
  console.log('�� Testando funções corretas do contrato...\n')
  
  // Testar admin() - já sabemos que funciona
  console.log('1. Testando admin()...')
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0xf851a440' }, 'latest'],
        id: 1
      })
    })
    const result = await response.json()
    const admin = '0x' + result.result.slice(26)
    console.log(`✅ admin(): ${admin}`)
  } catch (e) {
    console.log(`❌ admin(): ${e.message}`)
  }
  
  // Testar feeCollector() - calcular selector correto
  console.log('\n2. Testando feeCollector()...')
  // feeCollector() = keccak256("feeCollector()")[0:4] = 0x4ad57e3e
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0x4ad57e3e' }, 'latest'],
        id: 2
      })
    })
    const result = await response.json()
    if (result.error) {
      console.log(`❌ feeCollector(): ${result.error.message}`)
    } else {
      const feeCollector = '0x' + result.result.slice(26)
      console.log(`✅ feeCollector(): ${feeCollector}`)
    }
  } catch (e) {
    console.log(`❌ feeCollector(): ${e.message}`)
  }
  
  // Testar operadores(address)
  console.log('\n3. Testando operadores(address)...')
  // operadores(address) = keccak256("operadores(address)")[0:4] = 0x5c975abb
  const operadoresData = '0x5c975abb' + '000000000000000000000000' + adminAddress.slice(2).toLowerCase()
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', 
        method: 'eth_call',
        params: [{ to: contractAddress, data: operadoresData }, 'latest'],
        id: 3
      })
    })
    const result = await response.json()
    if (result.error) {
      console.log(`❌ operadores(${adminAddress}): ${result.error.message}`)
    } else {
      const isOperator = result.result === '0x0000000000000000000000000000000000000000000000000000000000000001'
      console.log(`✅ operadores(${adminAddress}): ${isOperator}`)
    }
  } catch (e) {
    console.log(`❌ operadores(): ${e.message}`)
  }
}

testCorrectFunctions()
