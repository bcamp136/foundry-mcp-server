import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spawn, ChildProcess } from "node:child_process";
import { PROJECT_ROOT } from "../utils.js";

// Store running Anvil process
let anvilProcess: ChildProcess | null = null;

export function registerAnvilTools(server: McpServer) {
  // --- Tool: anvil_start -----------------------------------
  server.registerTool(
    "anvil_start",
    {
      title: "Start Anvil",
      description:
        "Start a local Anvil blockchain node with optional configuration.",
      inputSchema: {
        port: z
          .number()
          .optional()
          .describe("Port for Anvil to listen on (default: 8545)"),
        chainId: z
          .number()
          .optional()
          .describe("Chain ID for the local network (default: 31337)"),
        accounts: z
          .number()
          .optional()
          .describe("Number of accounts to generate (default: 10)"),
        balance: z
          .string()
          .optional()
          .describe("Initial balance for each account in ETH (default: 10000)"),
        mnemonic: z
          .string()
          .optional()
          .describe("BIP39 mnemonic phrase to use"),
        forkUrl: z
          .string()
          .optional()
          .describe("URL to fork from (e.g., mainnet RPC)"),
        forkBlockNumber: z
          .number()
          .optional()
          .describe("Block number to fork from"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional anvil CLI flags")
      }
    },
    async ({ port, chainId, accounts, balance, mnemonic, forkUrl, forkBlockNumber, extraArgs = [] }) => {
      // Check if Anvil is already running
      if (anvilProcess && !anvilProcess.killed) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                tool: "anvil_start",
                success: false,
                error: "Anvil is already running. Use anvil_stop to stop it first."
              }, null, 2)
            }
          ]
        };
      }

      const args: string[] = [];

      if (port) args.push("--port", port.toString());
      if (chainId) args.push("--chain-id", chainId.toString());
      if (accounts) args.push("--accounts", accounts.toString());
      if (balance) args.push("--balance", balance);
      if (mnemonic) args.push("--mnemonic", mnemonic);
      if (forkUrl) args.push("--fork-url", forkUrl);
      if (forkBlockNumber) args.push("--fork-block-number", forkBlockNumber.toString());
      
      args.push(...extraArgs);

      try {
        anvilProcess = spawn("anvil", args, {
          cwd: PROJECT_ROOT,
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const payload = {
          tool: "anvil_start",
          success: true,
          pid: anvilProcess.pid,
          args,
          message: "Anvil started successfully"
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2)
            }
          ],
          structuredContent: payload
        };
      } catch (err: any) {
        const payload = {
          tool: "anvil_start",
          success: false,
          error: err.message
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2)
            }
          ],
          structuredContent: payload
        };
      }
    }
  );

  // --- Tool: anvil_stop ------------------------------------
  server.registerTool(
    "anvil_stop",
    {
      title: "Stop Anvil",
      description: "Stop the running Anvil blockchain node."
    },
    async () => {
      if (!anvilProcess || anvilProcess.killed) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                tool: "anvil_stop",
                success: false,
                error: "No Anvil process is currently running"
              }, null, 2)
            }
          ]
        };
      }

      try {
        anvilProcess.kill('SIGTERM');
        anvilProcess = null;

        const payload = {
          tool: "anvil_stop",
          success: true,
          message: "Anvil stopped successfully"
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2)
            }
          ],
          structuredContent: payload
        };
      } catch (err: any) {
        const payload = {
          tool: "anvil_stop",
          success: false,
          error: err.message
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2)
            }
          ],
          structuredContent: payload
        };
      }
    }
  );

  // --- Tool: anvil_status ----------------------------------
  server.registerTool(
    "anvil_status",
    {
      title: "Anvil Status",
      description: "Check if Anvil is currently running."
    },
    async () => {
      const isRunning = anvilProcess && !anvilProcess.killed;
      
      const payload = {
        tool: "anvil_status",
        isRunning,
        pid: isRunning ? anvilProcess?.pid : null
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2)
          }
        ],
        structuredContent: payload
      };
    }
  );
}

// Export cleanup function for the main server
export function cleanupAnvil() {
  if (anvilProcess && !anvilProcess.killed) {
    anvilProcess.kill('SIGTERM');
    anvilProcess = null;
  }
}
