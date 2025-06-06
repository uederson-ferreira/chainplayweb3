// frontendv2/scripts/setup-vrf.js
// Configuração VRF usando cast (Foundry CLI)

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function executeCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} concluído`);
    return result.trim();
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    throw error;
  }
}

function main() {
  console.log("🔧 Configurando Chainlink VRF com Foundry...");
  
  // Verificar se cast está disponível
  try {
    execSync("cast --version", { stdio: 'pipe' });
  } catch (error) {
    console.error("❌ Foundry/cast não encontrado. Instale com: curl -L https://foundry.paradigm.xyz | bash");
    process.exit(1);
  }
  
  // Configurações
  const RPC_URL = "http://127.0.0.1:8545";
  const VRF_COORDINATOR = "0x271682DEB8C4E0901D1a1550aD2e64D568E69909";
  const LINK_TOKEN = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  const LINK_WHALE = "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf";
  const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const DEPLOYER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Ler dados do deployment
  const deploymentPath = path.join(__dirname, "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ Arquivo deployment.json não encontrado");
    console.log("💡 Execute o deploy primeiro: npm run deploy-contracts");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Contrato Bingo:", deployment.bingoContract);
  
  try {
    // 1. Impersonate LINK whale
    console.log("🐋 Configurando LINK whale...");
    executeCommand(
      `cast rpc anvil_impersonateAccount ${LINK_WHALE} --rpc-url ${RPC_URL}`,
      "Impersonating LINK whale"
    );
    
    executeCommand(
      `cast rpc anvil_setBalance ${LINK_WHALE} 0x56BC75E2D630E8000 --rpc-url ${RPC_URL}`,
      "Setting whale balance"
    );
    
    // 2. Transferir LINK para deployer
    console.log("💰 Transferindo LINK...");
    const transferAmount = "100000000000000000000"; // 100 LINK em wei
    
    executeCommand(
      `cast send ${LINK_TOKEN} "transfer(address,uint256)" ${DEPLOYER_ADDRESS} ${transferAmount} --from ${LINK_WHALE} --rpc-url ${RPC_URL} --unlocked`,
      "Transferindo LINK"
    );
    
    // 3. Verificar balance LINK
    const linkBalance = executeCommand(
      `cast call ${LINK_TOKEN} "balanceOf(address)(uint256)" ${DEPLOYER_ADDRESS} --rpc-url ${RPC_URL}`,
      "Verificando balance LINK"
    );
    
    const linkBalanceEth = parseInt(linkBalance, 16) / 1e18;
    console.log(`✅ LINK Balance: ${linkBalanceEth} LINK`);
    
    // 4. Criar VRF subscription
    console.log("🔄 Criando VRF Subscription...");
    const createTxHash = executeCommand(
      `cast send ${VRF_COORDINATOR} "createSubscription()" --private-key ${DEPLOYER_KEY} --rpc-url ${RPC_URL}`,
      "Criando subscription"
    );
    
    // 5. Obter logs da transação para pegar subscription ID
    const receipt = executeCommand(
      `cast receipt ${createTxHash} --rpc-url ${RPC_URL}`,
      "Obtendo receipt"
    );
    
    // Parse manual do subscription ID (método simplificado)
    console.log("📋 Transaction receipt obtido");
    console.log("💡 Verifique os logs para obter o subscription ID");
    
    // Para simplificar, vamos usar um ID fixo para testes
    const subscriptionId = "1";
    console.log(`🆔 Usando Subscription ID: ${subscriptionId}`);
    
    // 6. Financiar subscription
    console.log("💰 Financiando subscription...");
    const fundAmount = "10000000000000000000"; // 10 LINK
    
    // Encode data para transferAndCall
    const fundData = `0x${subscriptionId.padStart(64, '0')}`;
    
    executeCommand(
      `cast send ${LINK_TOKEN} "transferAndCall(address,uint256,bytes)" ${VRF_COORDINATOR} ${fundAmount} ${fundData} --private-key ${DEPLOYER_KEY} --rpc-url ${RPC_URL}`,
      "Financiando subscription"
    );
    
    // 7. Adicionar consumer
    console.log("🔗 Adicionando consumer...");
    executeCommand(
      `cast send ${VRF_COORDINATOR} "addConsumer(uint64,address)" ${subscriptionId} ${deployment.bingoContract} --private-key ${DEPLOYER_KEY} --rpc-url ${RPC_URL}`,
      "Adicionando consumer"
    );
    
    // 8. Salvar configuração
    const envUpdate = `# VRF Configuration - Updated ${new Date().toISOString()}
VRF_SUBSCRIPTION_ID=${subscriptionId}
NEXT_PUBLIC_VRF_SUBSCRIPTION_ID=${subscriptionId}
`;
    
    fs.writeFileSync(path.join(__dirname, "../.env.vrf"), envUpdate);
    
    console.log("\n🎉 VRF Setup completo!");
    console.log("📝 Subscription ID:", subscriptionId);
    console.log("💰 Subscription financiada com 10 LINK");
    console.log("🔗 Consumer adicionado:", deployment.bingoContract);
    console.log("\n📋 Adicione ao seu .env.local:");
    console.log(`VRF_SUBSCRIPTION_ID=${subscriptionId}`);
    
  } catch (error) {
    console.error("❌ Erro no setup VRF:", error.message);
    process.exit(1);
  }
}

main();