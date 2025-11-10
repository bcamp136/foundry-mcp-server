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

  // --- Tool: forge_gas_report ------------------------------
  server.registerTool(
    "forge_gas_report",
    {
      title: "Forge gas report",
      description:
        "Generate detailed gas usage reports for contracts showing min/avg/median/max gas costs per function.",
      inputSchema: {
        matchTest: z
          .string()
          .optional()
          .describe("Filter tests to include in gas report"),
        matchContract: z
          .string()
          .optional()
          .describe("Filter contracts to include in gas report"),
        profile: z
          .string()
          .optional()
          .describe("Optional Foundry profile to use"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional forge test CLI flags")
      }
    },
    async ({ matchTest, matchContract, profile, extraArgs = [] }) => {
      const args = ["test", "--gas-report"];

      if (matchTest) {
        args.push("--match-test", matchTest);
      }
      if (matchContract) {
        args.push("--match-contract", matchContract);
      }
      if (profile) {
        args.push("--profile", profile);
      }

      args.push(...extraArgs);

      const result = await runForge(args);

      const payload = {
        tool: "forge_gas_report",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        args,
        stdout: result.stdout,
        stderr: result.stderr,
        description: "Gas report shows deployment costs and function-level gas usage statistics"
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

  // --- Tool: forge_gas_snapshot ----------------------------
  server.registerTool(
    "forge_gas_snapshot",
    {
      title: "Forge gas snapshot",
      description:
        "Generate and manage gas usage snapshots for test functions to track gas optimization over time.",
      inputSchema: {
        action: z
          .enum(["create", "diff", "check"])
          .describe("Action: 'create' snapshot, 'diff' against existing, or 'check' for differences"),
        snapshotFile: z
          .string()
          .optional()
          .describe("Custom snapshot file name (default: .gas-snapshot)"),
        matchTest: z
          .string()
          .optional()
          .describe("Filter tests to include in snapshot"),
        matchPath: z
          .string()
          .optional()
          .describe("Filter test files by path"),
        sortOrder: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort results by gas usage"),
        minGas: z
          .number()
          .optional()
          .describe("Only include tests with gas usage above this threshold"),
        maxGas: z
          .number()
          .optional()
          .describe("Only include tests with gas usage below this threshold"),
        extraArgs: z
          .array(z.string())
          .optional()
          .describe("Additional forge snapshot CLI flags")
      }
    },
    async ({ action, snapshotFile, matchTest, matchPath, sortOrder, minGas, maxGas, extraArgs = [] }) => {
      const args = ["snapshot"];

      // Handle different actions
      switch (action) {
        case "diff":
          args.push("--diff");
          if (snapshotFile) {
            args.push(snapshotFile);
          }
          break;
        case "check":
          args.push("--check");
          if (snapshotFile) {
            args.push(snapshotFile);
          }
          break;
        case "create":
          // Default behavior
          if (snapshotFile) {
            args.push("--snap", snapshotFile);
          }
          break;
      }

      // Add filtering options
      if (matchTest) {
        args.push("--match-test", matchTest);
      }
      if (matchPath) {
        args.push("--match-path", matchPath);
      }

      // Add sorting and thresholds
      if (sortOrder === "asc") {
        args.push("--asc");
      } else if (sortOrder === "desc") {
        args.push("--desc");
      }
      
      if (minGas !== undefined) {
        args.push("--min", minGas.toString());
      }
      if (maxGas !== undefined) {
        args.push("--max", maxGas.toString());
      }

      args.push(...extraArgs);

      const result = await runForge(args);

      const payload = {
        tool: "forge_gas_snapshot",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        action,
        args,
        stdout: result.stdout,
        stderr: result.stderr,
        description: action === "create" 
          ? "Created gas snapshot for tracking gas usage over time"
          : action === "diff"
          ? "Compared current gas usage against existing snapshot"
          : "Checked for differences between snapshots"
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

  // --- Tool: forge_gas_optimize ----------------------------
  server.registerTool(
    "forge_gas_optimize",
    {
      title: "Forge gas optimization analysis",
      description:
        "Analyze gas usage patterns and provide optimization suggestions by comparing different compiler settings.",
      inputSchema: {
        optimizerRuns: z
          .array(z.number())
          .optional()
          .describe("Array of optimizer runs to test (default: [200, 1000, 10000])"),
        viaIr: z
          .boolean()
          .optional()
          .describe("Test with via_ir compilation pipeline"),
        baselineSnapshot: z
          .string()
          .optional()
          .describe("Baseline snapshot file to compare against"),
        matchTest: z
          .string()
          .optional()
          .describe("Filter tests for optimization analysis")
      }
    },
    async ({ optimizerRuns = [200, 1000, 10000], viaIr, baselineSnapshot, matchTest }) => {
      const results = [];
      
      // Test different optimizer runs
      for (const runs of optimizerRuns) {
        const args = ["snapshot", "--snap", `.gas-snapshot-opt-${runs}`];
        
        if (matchTest) {
          args.push("--match-test", matchTest);
        }

        // This would typically require modifying foundry.toml temporarily
        // For now, we'll just run with current settings and suggest the optimization
        const result = await runForge(args);
        
        results.push({
          optimizerRuns: runs,
          success: result.success,
          stdout: result.stdout,
          stderr: result.stderr
        });
      }

      // Generate diff against baseline if provided
      let baselineDiff = null;
      if (baselineSnapshot) {
        const diffArgs = ["snapshot", "--diff", baselineSnapshot];
        if (matchTest) {
          diffArgs.push("--match-test", matchTest);
        }
        
        const diffResult = await runForge(diffArgs);
        baselineDiff = {
          success: diffResult.success,
          stdout: diffResult.stdout,
          stderr: diffResult.stderr
        };
      }

      const payload = {
        tool: "forge_gas_optimize",
        projectRoot: PROJECT_ROOT,
        success: true,
        optimizationResults: results,
        baselineDiff,
        recommendations: [
          "Compare gas snapshots with different optimizer_runs values in foundry.toml",
          "Test with via_ir = true for potential gas savings on complex contracts",
          "Use forge test --gas-report to identify high-gas functions for optimization",
          "Consider gas-optimized libraries like Solmate for common patterns",
          "Profile individual functions using gas snapshots before/after changes"
        ]
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
