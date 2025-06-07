require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');

async function verifyAdmin() {
  console.log('🔍 Verificando admin do contrato usando .env...\n');
  
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const contractAddress = process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS;
  const adminAccount = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS;
  const chainId = process.env.NEXT_PUBLIC_NETWORK_ID;
  
  console.log('📍 Configurações do .env:');
  console.log('   RPC URL:', rpcUrl);
  console.log('   Contrato:', contractAddress);
  console.log('   Admin:', adminAccount);
  console.log('   Chain ID:', chainId);
  console.log('');
  
  if (!rpcUrl || !contractAddress || !adminAccount) {
    console.log('❌ ERRO: Variáveis do .env não encontradas!');
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    const code = await provider.getCode(contractAddress);
    console.log('📝 Contrato existe?', code !== '0x');
    
    if (code === '0x') {
      console.log('❌ ERRO: Contrato não encontrado!');
      return;
    }
    
    // Verificar owner
    const ownerResult = await provider.call({
      to: contractAddress,
      data: '0x8da5cb5b'
    });
    
    const owner = '0x' + ownerResult.slice(26);
    console.log('👑 Owner do contrato:', owner);
    console.log('👑 Admin esperado:', adminAccount);
    console.log('✅ É owner?', owner.toLowerCase() === adminAccount.toLowerCase());
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verifyAdmin();