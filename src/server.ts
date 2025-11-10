import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerForgeTools } from "./tools/forge.js";
import { registerAnvilTools, cleanupAnvil } from "./tools/anvil.js";
import { registerCastTools } from "./tools/cast.js";
import { registerProjectTools } from "./tools/project.js";
import { registerTemplateTools } from "./tools/templates.js";

// Create MCP server
const server = new McpServer({
  name: "foundry-mcp",
  version: "0.1.0"
});

// Register all tools
registerForgeTools(server);
registerAnvilTools(server);
registerCastTools(server);
registerProjectTools(server);
registerTemplateTools(server);

// --- Start the MCP server over stdio -----------------------

const transport = new StdioServerTransport();

// Cleanup handler to stop Anvil on exit
process.on('SIGTERM', () => {
  cleanupAnvil();
  process.exit(0);
});

process.on('SIGINT', () => {
  cleanupAnvil();
  process.exit(0);
});

async function main() {
  await server.connect(transport);
}

main().catch(err => {
  console.error("Fatal error in MCP server:", err);
  cleanupAnvil();
  process.exit(1);
});
