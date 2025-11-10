import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runCast, PROJECT_ROOT, DEFAULT_PRIVATE_KEY } from "../utils.js";

export function registerCastTools(server: McpServer) {
  // --- Tool: cast_call -------------------------------------
  server.registerTool(
    "cast_call",
    {
      title: "Cast call",
      description: "Call a read-only function on a contract using cast.",
      inputSchema: {
        contractAddress: z
          .string()
          .describe("The contract address to call"),
        signature: z
          .string()
          .describe("Function signature (e.g., 'balanceOf(address)')"),
        args: z
          .array(z.string())
          .optional()
          .describe("Function arguments"),
        rpcUrl: z
          .string()
          .optional()
          .describe("RPC URL (defaults to local Anvil)"),
        blockNumber: z
          .string()
          .optional()
          .describe("Block number to query at"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional cast call CLI flags")
      }
    },
    async ({ contractAddress, signature, args = [], rpcUrl, blockNumber, extraArgs = [] }) => {
      const castArgs = ["call"];

      if (rpcUrl) {
        castArgs.push("--rpc-url", rpcUrl);
      }
      if (blockNumber) {
        castArgs.push("--block", blockNumber);
      }

      castArgs.push(contractAddress, signature, ...args, ...extraArgs);

      const result = await runCast(castArgs);

      const payload = {
        tool: "cast_call",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args: castArgs,
        stdout: result.stdout,
        stderr: result.stderr
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

  // --- Tool: cast_send -------------------------------------
  server.registerTool(
    "cast_send",
    {
      title: "Cast send",
      description: "Send a transaction to a contract using cast.",
      inputSchema: {
        contractAddress: z
          .string()
          .describe("The contract address to send to"),
        signature: z
          .string()
          .describe("Function signature (e.g., 'transfer(address,uint256)')"),
        args: z
          .array(z.string())
          .optional()
          .describe("Function arguments"),
        privateKey: z
          .string()
          .optional()
          .describe("Private key to sign with (falls back to FOUNDRY_PRIVATE_KEY env var)"),
        from: z
          .string()
          .optional()
          .describe("From address"),
        value: z
          .string()
          .optional()
          .describe("ETH value to send"),
        gasLimit: z
          .string()
          .optional()
          .describe("Gas limit"),
        gasPrice: z
          .string()
          .optional()
          .describe("Gas price"),
        rpcUrl: z
          .string()
          .optional()
          .describe("RPC URL (defaults to local Anvil)"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional cast send CLI flags")
      }
    },
    async ({ contractAddress, signature, args = [], privateKey, from, value, gasLimit, gasPrice, rpcUrl, extraArgs = [] }) => {
      const castArgs = ["send"];

      if (rpcUrl) {
        castArgs.push("--rpc-url", rpcUrl);
      }
      
      // Use provided private key or fall back to environment variable
      const keyToUse = privateKey || DEFAULT_PRIVATE_KEY;
      if (keyToUse) {
        castArgs.push("--private-key", keyToUse);
      }
      
      if (from) {
        castArgs.push("--from", from);
      }
      if (value) {
        castArgs.push("--value", value);
      }
      if (gasLimit) {
        castArgs.push("--gas-limit", gasLimit);
      }
      if (gasPrice) {
        castArgs.push("--gas-price", gasPrice);
      }

      castArgs.push(contractAddress, signature, ...args, ...extraArgs);

      const result = await runCast(castArgs);

      const payload = {
        tool: "cast_send",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args: castArgs,
        stdout: result.stdout,
        stderr: result.stderr
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

  // --- Tool: cast_estimate_gas -----------------------------
  server.registerTool(
    "cast_estimate_gas",
    {
      title: "Cast estimate gas",
      description: "Estimate gas for a transaction using cast.",
      inputSchema: {
        contractAddress: z
          .string()
          .describe("The contract address"),
        signature: z
          .string()
          .describe("Function signature"),
        args: z
          .array(z.string())
          .optional()
          .describe("Function arguments"),
        from: z
          .string()
          .optional()
          .describe("From address"),
        value: z
          .string()
          .optional()
          .describe("ETH value to send"),
        rpcUrl: z
          .string()
          .optional()
          .describe("RPC URL (defaults to local Anvil)"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional cast estimate CLI flags")
      }
    },
    async ({ contractAddress, signature, args = [], from, value, rpcUrl, extraArgs = [] }) => {
      const castArgs = ["estimate"];

      if (rpcUrl) {
        castArgs.push("--rpc-url", rpcUrl);
      }
      if (from) {
        castArgs.push("--from", from);
      }
      if (value) {
        castArgs.push("--value", value);
      }

      castArgs.push(contractAddress, signature, ...args, ...extraArgs);

      const result = await runCast(castArgs);

      const payload = {
        tool: "cast_estimate_gas",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args: castArgs,
        stdout: result.stdout,
        stderr: result.stderr
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

  // --- Tool: cast_balance ----------------------------------
  server.registerTool(
    "cast_balance",
    {
      title: "Cast balance",
      description: "Get the balance of an address using cast.",
      inputSchema: {
        address: z
          .string()
          .describe("The address to check balance for"),
        rpcUrl: z
          .string()
          .optional()
          .describe("RPC URL (defaults to local Anvil)"),
        blockNumber: z
          .string()
          .optional()
          .describe("Block number to query at"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional cast balance CLI flags")
      }
    },
    async ({ address, rpcUrl, blockNumber, extraArgs = [] }) => {
      const castArgs = ["balance"];

      if (rpcUrl) {
        castArgs.push("--rpc-url", rpcUrl);
      }
      if (blockNumber) {
        castArgs.push("--block", blockNumber);
      }

      castArgs.push(address, ...extraArgs);

      const result = await runCast(castArgs);

      const payload = {
        tool: "cast_balance",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args: castArgs,
        stdout: result.stdout,
        stderr: result.stderr
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

  // --- Tool: cast_wallet_info ------------------------------
  server.registerTool(
    "cast_wallet_info",
    {
      title: "Cast wallet info",
      description: "Get wallet information including the address for the configured private key.",
    },
    async () => {
      const keyToUse = DEFAULT_PRIVATE_KEY;
      
      if (!keyToUse) {
        const payload = {
          tool: "cast_wallet_info",
          success: false,
          error: "No private key configured. Set FOUNDRY_PRIVATE_KEY environment variable."
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

      // Get the wallet address from the private key
      const result = await runCast(["wallet", "address", "--private-key", keyToUse]);

      const payload = {
        tool: "cast_wallet_info",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        privateKeyConfigured: true,
        address: result.success ? result.stdout.trim() : null,
        stdout: result.stdout,
        stderr: result.stderr
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
