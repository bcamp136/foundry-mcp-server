# Foundry MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Foundry, Anvil, and Cast commands.

## Setup for VS Code

### Prerequisites

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install Node.js** (version 18 or higher)

3. **Ensure GitHub Copilot is set up** in VS Code with MCP support enabled

> For detailed information about MCP server setup in VS Code, see the [official VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/copilot-extensibility-overview#_model-context-protocol-mcp).

### Local Setup

1. **Clone and build the MCP server**:
   ```bash
   git clone <your-repo-url>
   cd foundry-mcp-server
   npm install
   npm run build
   ```

2. **Configure VS Code settings**:
   
   Open your VS Code settings (Command Palette → "Preferences: Open User Settings (JSON)") and add the MCP server configuration:

   ```json
   {
     "github.copilot.chat.mcp.servers": {
       "foundry": {
         "command": "node",
         "args": ["/absolute/path/to/foundry-mcp-server/dist/server.js"],
         "env": {
           "FOUNDRY_PRIVATE_KEY": "0x_your_private_key_here_optional",
           "PROJECT_ROOT": "/path/to/your/foundry/project"
         }
       }
     }
   }
   ```

   **Important**: Replace `/absolute/path/to/foundry-mcp-server` with the actual absolute path to where you cloned this repository.

3. **Restart VS Code** to load the MCP server

4. **Verify the setup**:
   - Open GitHub Copilot Chat in VS Code
   - You should see the Foundry MCP server listed as connected
   - Try using tools like `foundry_project_info` to test the connection

### Alternative Setup with npm link

If you prefer to install globally:

```bash
cd foundry-mcp-server
npm run build
npm link
```

Then in your VS Code settings, use:

```json
{
  "github.copilot.chat.mcp.servers": {
    "foundry": {
      "command": "foundry-mcp-server",
      "env": {
        "FOUNDRY_PRIVATE_KEY": "0x_your_private_key_here_optional",
        "PROJECT_ROOT": "/path/to/your/foundry/project"
      }
    }
  }
}
```

### Development Setup

For development and testing:

1. **Run in development mode**:
   ```bash
   npm run dev
   ```

2. **Watch for changes** (if you modify the code):
   ```bash
   npm run build
   # Restart VS Code to reload the MCP server
   ```

## Environment Variables

### FOUNDRY_PRIVATE_KEY

Set this environment variable to provide a default private key for Cast operations that require transaction signing:

```bash
export FOUNDRY_PRIVATE_KEY="0x your_private_key_here"
```

When this environment variable is set:
- `cast_send` operations will automatically use this key if no explicit `privateKey` parameter is provided
- You can check the wallet address associated with this key using the `cast_wallet_info` tool

### PROJECT_ROOT

Override the default project root directory:

```bash
export PROJECT_ROOT="/path/to/your/foundry/project"
```

If not set, defaults to the current working directory.

## Tools

### Forge Tools
- `forge_build` - Compile contracts
- `forge_test` - Run tests
- `forge_gas_report` - Generate detailed gas usage reports with min/avg/median/max costs
- `forge_gas_snapshot` - Create, compare, and manage gas snapshots for regression testing
- `forge_gas_optimize` - Analyze gas patterns and provide optimization suggestions

### Anvil Tools  
- `anvil_start` - Start local blockchain
- `anvil_stop` - Stop local blockchain
- `anvil_status` - Check if Anvil is running

### Cast Tools
- `cast_call` - Call read-only contract functions
- `cast_send` - Send transactions (uses FOUNDRY_PRIVATE_KEY if no key provided)
- `cast_estimate_gas` - Estimate gas for transactions
- `cast_balance` - Get address balance
- `cast_wallet_info` - Get wallet info for configured private key

### Project Tools
- `foundry_project_info` - Get project directory structure

### Template Tools
- `generate_contract_prompt` - Generate structured prompts for AI tools following Foundry best practices
- `foundry_project_template` - Generate complete Foundry project structure with configuration

### Gas Analysis Tools
- `gas_profile_function` - Profile specific function gas usage with targeted analysis
- `gas_compare_implementations` - Compare gas costs between different implementations
- `gas_regression_test` - Monitor for gas usage regressions against baselines
- `gas_optimization_suggestions` - Get specific optimization recommendations

## Creating Smart Contracts with AI

This MCP server includes specialized tools for generating smart contracts using AI tools like ChatGPT or Claude, following Foundry's official prompting guidelines.

### Workflow:

1. **Generate a structured prompt**:
   ```
   Use the generate_contract_prompt tool with your requirements:
   - Requirements: "Create an ERC20 token with minting and burning capabilities"
   - Contract type: "token" 
   - Include comprehensive tests and deployment scripts
   ```

2. **Copy the generated prompt** to your AI tool of choice (ChatGPT, Claude, etc.)

3. **Get AI-generated code** that follows Foundry best practices including:
   - Proper project structure
   - Comprehensive testing (unit, fuzz, invariant)
   - Security best practices
   - Deployment scripts with verification
   - NatSpec documentation

4. **Generate project structure** using `foundry_project_template` for a complete boilerplate

### Supported Contract Types:
- **Token**: ERC20 implementations with advanced features
- **Vault**: ERC4626 compliant vaults with yield mechanisms  
- **DeFi**: DEX, lending, and other DeFi protocols
- **NFT**: ERC721/ERC1155 implementations
- **Governance**: Voting and proposal mechanisms
- **Proxy**: Upgradeable contract patterns
- **Custom**: Any other contract type

## Gas Optimization Workflow

This MCP server provides comprehensive gas analysis and optimization tools based on Foundry's gas tracking capabilities.

### Gas Analysis Pipeline:

1. **Generate baseline reports**:
   ```
   Use forge_gas_report to get detailed function-level gas usage
   Use forge_gas_snapshot with action="create" to establish baselines
   ```

2. **Profile specific functions**:
   ```
   Use gas_profile_function for targeted analysis of expensive functions
   Compare different implementation approaches with gas_compare_implementations
   ```

3. **Monitor for regressions**:
   ```
   Use gas_regression_test to detect gas increases during development
   Set up automated testing with configurable thresholds
   ```

4. **Get optimization guidance**:
   ```
   Use gas_optimization_suggestions for targeted improvement recommendations
   Focus on specific areas: deployment, functions, loops, storage, external_calls
   ```

### Optimization Strategies Supported:

- **Function-level Analysis**: Min/avg/median/max gas costs per function
- **Snapshot Comparisons**: Track gas usage changes over time  
- **Implementation Testing**: A/B test different coding approaches
- **Regression Detection**: Automated monitoring with configurable thresholds
- **Targeted Recommendations**: Focus on deployment, loops, storage, or external calls

### Example Gas Optimization Workflow:

```bash
# 1. Establish baseline
forge_gas_snapshot action="create" snapshotFile=".gas-baseline"

# 2. Get detailed function analysis  
forge_gas_report matchContract="MyContract"

# 3. Profile expensive functions
gas_profile_function contractName="MyContract" functionName="expensiveFunction"

# 4. Test optimization
# ... make code changes ...

# 5. Check for regressions
gas_regression_test baselineSnapshot=".gas-baseline" threshold=5

# 6. Compare implementations
gas_compare_implementations implementationTests=["testOriginal", "testOptimized"]
```

## Security

⚠️ **Important**: Never commit private keys to version control. Always use environment variables or secure key management solutions.

## Troubleshooting

### Common Issues

1. **MCP Server not connecting**:
   - Ensure the path in VS Code settings is absolute and correct
   - Check that the build was successful (`npm run build`)
   - Restart VS Code after configuration changes

2. **Foundry commands not working**:
   - Verify Foundry is installed: `forge --version`
   - Make sure you're in a Foundry project directory or set `PROJECT_ROOT`

3. **Private key not working**:
   - Ensure the private key format is correct (starts with `0x`)
   - Test with `cast_wallet_info` to verify the key is valid

4. **Permission denied errors**:
   - Ensure the MCP server script is executable
   - Check file permissions on the repository directory

### Debug Mode

To see detailed logs, you can run the MCP server directly:

```bash
cd foundry-mcp-server
node dist/server.js
```

This will show any startup errors or connection issues.
