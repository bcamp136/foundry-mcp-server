# Foundry MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Foundry, Anvil, and Cast commands.

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

## Security

⚠️ **Important**: Never commit private keys to version control. Always use environment variables or secure key management solutions.
