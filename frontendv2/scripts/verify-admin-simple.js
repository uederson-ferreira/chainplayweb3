// Script simples usando fetch nativo
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

async function verifyAdmin() {
  console.log('🔍 Verificando admin do contrato...\n');
  
  const env = loadEnv();
  const rpcUrl = env.NEXT_PUBLIC_RPC_URL;
  const contractAddress = env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS;
  const adminAccount = env.NEXT_PUBLIC_OPERATOR_ADDRESS;
  
  console.log('📍 Configurações:');
  console.log('   RPC URL:', rpcUrl);
  console.log('   Contrato:', contractAddress);
  console.log('   Admin:', adminAccount);
  console.log('');
  
  try {
    // Verificar se contrato existe
    const codeResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [contractAddress, 'latest'],
        id: 1
      })
    });
    
    const codeResult = await codeResponse.json();
    const contractExists = codeResult.result !== '0x';
    
    console.log('📝 Contrato existe?', contractExists);
    
    if (!contractExists) {
      console.log('❌ ERRO: Contrato não encontrado!');
      return;
    }
    
    // Verificar owner
    const ownerResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: '0x8da5cb5b' // owner()
        }, 'latest'],
        id: 2
      })
    });
    
    const ownerResult = await ownerResponse.json();
    const owner = '0x' + ownerResult.result.slice(26);
    
    console.log('👑 Owner do contrato:', owner);
    console.log('👑 Admin esperado:', adminAccount);
    console.log('✅ É owner?', owner.toLowerCase() === adminAccount.toLowerCase());
    
    // Verificar se é operador
    const operatorData = '0x13e7c9d8' + '000000000000000000000000' + adminAccount.slice(2).toLowerCase();
    
    const operatorResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: operatorData
        }, 'latest'],
        id: 3
      })
    });
    
    const operatorResult = await operatorResponse.json();
    const isOperator = operatorResult.result === '0x0000000000000000000000000000000000000000000000000000000000000001';
    
    console.log('🛡️ É operador?', isOperator);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verifyAdmin();