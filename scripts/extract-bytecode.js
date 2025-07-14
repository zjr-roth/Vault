const fs = require('fs');
const path = require('path');

async function extractBytecode() {
  try {
    // Path to the compiled contract artifact
    const artifactPath = path.join(__dirname, 'artifacts/contracts/SyndicateVault.sol/SyndicateVault.json');

    if (!fs.existsSync(artifactPath)) {
      console.error('Contract artifact not found. Run "npx hardhat compile" first.');
      process.exit(1);
    }

    // Read the artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Extract bytecode
    const bytecode = artifact.bytecode;

    if (!bytecode || bytecode === '0x') {
      console.error('No bytecode found in artifact. Contract may not have compiled correctly.');
      process.exit(1);
    }

    // Create bytecode file for frontend
    const bytecodeContent = `// Auto-generated from contract compilation
// Run 'npm run extract-bytecode' to update

export const SYNDICATE_VAULT_BYTECODE = "${bytecode}" as const;

// Contract creation code size
export const BYTECODE_SIZE = ${bytecode.length / 2 - 1} // bytes

// Gas estimate for deployment (rough calculation)
export const ESTIMATED_DEPLOY_GAS = ${Math.ceil((bytecode.length / 2) * 10)} // wei
`;

    // Write to frontend utils
    const outputPath = path.join(__dirname, 'frontend/src/utils/contractBytecode.ts');
    fs.writeFileSync(outputPath, bytecodeContent);

    console.log('✅ Bytecode extracted successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📏 Bytecode size: ${bytecode.length / 2 - 1} bytes`);
    console.log(`⛽ Estimated deploy gas: ~${Math.ceil((bytecode.length / 2) * 10)} wei`);

  } catch (error) {
    console.error('❌ Error extracting bytecode:', error.message);
    process.exit(1);
  }
}

extractBytecode();