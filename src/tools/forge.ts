import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runForge, PROJECT_ROOT } from "../utils.js";

export function registerForgeTools(server: McpServer) {
  // --- Tool: forge_build -----------------------------------
  server.registerTool(
    "forge_build",
    {
      title: "Forge build",
      description:
        "Run `forge build` in the current Foundry project to compile contracts.",
      inputSchema: {
        profile: z
          .string()
          .optional()
          .describe("Optional Foundry profile to use"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional forge build CLI flags")
      },
    },
    async ({ profile, extraArgs = [] }) => {
      const args = ["build"];

      if (profile) {
        args.push("--profile", profile);
      }
      args.push(...extraArgs);

      const result = await runForge(args);

      const payload = {
        tool: "forge_build",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args,
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

  // --- Tool: forge_test ------------------------------------
  server.registerTool(
    "forge_test",
    {
      title: "Forge test",
      description:
        "Run `forge test` with optional filters and flags to execute Solidity tests.",
      inputSchema: {
        matchTest: z
          .string()
          .optional()
          .describe("Value for `--match-test` to run a single test or pattern"),
        matchPath: z
          .string()
          .optional()
          .describe("Value for `--match-path` to filter test files"),
        profile: z
          .string()
          .optional()
          .describe("Optional Foundry profile to use"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional forge test CLI flags, e.g. ['-vvvv']")
      }
    },
    async ({ matchTest, matchPath, profile, extraArgs = [] }) => {
      const args = ["test"];

      if (matchTest) {
        args.push("--match-test", matchTest);
      }
      if (matchPath) {
        args.push("--match-path", matchPath);
      }
      if (profile) {
        args.push("--profile", profile);
      }

      args.push(...extraArgs);

      const result = await runForge(args);

      const payload = {
        tool: "forge_test",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args,
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
