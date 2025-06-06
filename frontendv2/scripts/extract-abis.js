// frontendv2/scripts/extract-abis.js
// Extrai ABIs dos artifacts do Foundry e atualiza o frontend

const fs = require("fs");
const path = require("path");

function main() {
  console.log("📜 Extraindo ABIs do Foundry...");
  
  // Caminhos para os artifacts do Foundry
  const contractsPath = path.join(__dirname, "../../contracts");
  const cartelaArtifactPath = path.join(contractsPath, "out/CartelaContract.sol/CartelaContract.json");
  const bingoArtifactPath = path.join(contractsPath, "out/BingoGameContract.sol/BingoGameContract.json");
  
  // Caminho de destino no frontend
  const abisPath = path.join(__dirname, "../lib/web3/contracts/abis.ts");
  
  try {
    // Verificar se artifacts existem
    if (!fs.existsSync(cartelaArtifactPath)) {
      throw new Error(`❌ Artifact não encontrado: ${cartelaArtifactPath}`);
    }
    
    if (!fs.existsSync(bingoArtifactPath)) {
      throw new Error(`❌ Artifact não encontrado: ${bingoArtifactPath}`);
    }
    
    // Ler artifacts
    console.log("📖 Lendo artifacts...");
    const cartelaArtifact = JSON.parse(fs.readFileSync(cartelaArtifactPath, "utf8"));
    const bingoArtifact = JSON.parse(fs.readFileSync(bingoArtifactPath, "utf8"));
    
    console.log("✅ CartelaContract ABI:", cartelaArtifact.abi.length, "functions");
    console.log("✅ BingoGameContract ABI:", bingoArtifact.abi.length, "functions");
    
    // Gerar arquivo TypeScript
    const abisContent = `// ABIs gerados automaticamente do Foundry - não editar manualmente
// Gerado em: ${new Date().toISOString()}
// Fonte: contracts/out/

export const CARTELA_ABI = ${JSON.stringify(cartelaArtifact.abi, null, 2)} as const

export const BINGO_ABI = ${JSON.stringify(bingoArtifact.abi, null, 2)} as const
`;
    
    // Criar diretório se não existir
    const abisDir = path.dirname(abisPath);
    if (!fs.existsSync(abisDir)) {
      fs.mkdirSync(abisDir, { recursive: true });
      console.log("📁 Diretório criado:", abisDir);
    }
    
    // Salvar arquivo
    fs.writeFileSync(abisPath, abisContent);
    console.log("✅ ABIs atualizadas em:", abisPath);
    
    // Estatísticas
    console.log("\n📊 Estatísticas das ABIs:");
    console.log("  CartelaContract:");
    console.log("    - Functions:", cartelaArtifact.abi.filter(x => x.type === 'function').length);
    console.log("    - Events:", cartelaArtifact.abi.filter(x => x.type === 'event').length);
    console.log("  BingoGameContract:");
    console.log("    - Functions:", bingoArtifact.abi.filter(x => x.type === 'function').length);
    console.log("    - Events:", bingoArtifact.abi.filter(x => x.type === 'event').length);
    
    console.log("\n🎉 ABIs extraídas com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao extrair ABIs:", error.message);
    console.log("\n💡 Certifique-se de:");
    console.log("1. Ter compilado os contratos: cd contracts && forge build");
    console.log("2. Os artifacts estão em contracts/out/");
    process.exit(1);
  }
}

// Executar imediatamente (não async)
main();