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

3. **Install the Claude for VS Code extension** from the VS Code marketplace

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
     "claude.mcpServers": {
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
   - Open the Claude extension in VS Code
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
  "claude.mcpServers": {
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
