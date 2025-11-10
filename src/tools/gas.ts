import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runForge, PROJECT_ROOT } from "../utils.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export function registerGasTools(server: McpServer) {
  // --- Tool: gas_profile_function --------------------------
  server.registerTool(
    "gas_profile_function",
    {
      title: "Profile specific function gas usage",
      description:
        "Create targeted gas analysis for specific functions using gas snapshots and section tracking.",
      inputSchema: {
        contractName: z
          .string()
          .describe("Name of the contract containing the function"),
        functionName: z
          .string()
          .describe("Name of the function to profile"),
        testInputs: z
          .array(z.string())
          .optional()
          .describe("Different input parameters to test (as strings)"),
        createBaseline: z
          .boolean()
          .optional()
          .describe("Create a baseline snapshot for future comparisons")
      }
    },
    async ({ contractName, functionName, testInputs = [], createBaseline = false }) => {
      // Generate a specific test name pattern
      const testPattern = `test.*${functionName}`;
      
      // Create snapshot for this specific function
      const snapshotFile = `.gas-snapshot-${contractName}-${functionName}`;
      const args = ["snapshot", "--match-test", testPattern, "--snap", snapshotFile];
      
      const result = await runForge(args);

      // If creating baseline, copy to baseline file
      if (createBaseline && result.success) {
        const baselineFile = `${snapshotFile}-baseline`;
        try {
          if (existsSync(path.join(PROJECT_ROOT, snapshotFile))) {
            const content = readFileSync(path.join(PROJECT_ROOT, snapshotFile), 'utf8');
            writeFileSync(path.join(PROJECT_ROOT, baselineFile), content);
          }
        } catch (error) {
          // Handle file operations gracefully
        }
      }

      const payload = {
        tool: "gas_profile_function",
        projectRoot: PROJECT_ROOT,
        success: result.success,
        contractName,
        functionName,
        snapshotFile,
        args,
        stdout: result.stdout,
        stderr: result.stderr,
        optimization_tips: [
          "Use vm.snapshotGasLeft() and vm.snapshotGas() in tests for precise measurements",
          "Test with different input sizes to identify scaling issues",
          "Compare gas usage with equivalent functions from gas-optimized libraries",
          "Consider assembly optimizations for frequently called functions"
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

  // --- Tool: gas_compare_implementations -------------------
  server.registerTool(
    "gas_compare_implementations",
    {
      title: "Compare gas usage between implementations",
      description:
        "Compare gas costs between different implementations of the same functionality.",
      inputSchema: {
        implementationTests: z
          .array(z.string())
          .describe("Array of test names representing different implementations"),
        baselineTest: z
          .string()
          .optional()
          .describe("Test name to use as baseline for comparison"),
        outputFormat: z
          .enum(["table", "json", "diff"])
          .optional()
          .describe("Output format for comparison results")
      }
    },
    async ({ implementationTests, baselineTest, outputFormat = "table" }) => {
      const results = [];
      
      // Run snapshot for each implementation
      for (const testName of implementationTests) {
        const snapshotFile = `.gas-snapshot-impl-${testName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const args = ["snapshot", "--match-test", testName, "--snap", snapshotFile];
        
        const result = await runForge(args);
        results.push({
          testName,
          snapshotFile,
          success: result.success,
          stdout: result.stdout,
          stderr: result.stderr
        });
      }

      // Generate diff against baseline if provided
      let comparison = null;
      if (baselineTest) {
        const baselineSnapshotFile = `.gas-snapshot-impl-${baselineTest.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        for (const impl of results) {
          if (impl.testName !== baselineTest) {
            const diffArgs = ["snapshot", "--diff", baselineSnapshotFile, "--match-test", impl.testName];
            const diffResult = await runForge(diffArgs);
            
            if (!comparison) comparison = [];
            comparison.push({
              implementation: impl.testName,
              baseline: baselineTest,
              diff: diffResult.stdout
            });
          }
        }
      }

      const payload = {
        tool: "gas_compare_implementations",
        projectRoot: PROJECT_ROOT,
        success: true,
        implementations: results,
        comparison,
        analysis_suggestions: [
          "Look for patterns in gas differences across implementations",
          "Identify which operations cause the most gas variance",
          "Consider hybrid approaches combining the best aspects of each implementation",
          "Test with realistic input sizes and edge cases"
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

  // --- Tool: gas_regression_test ---------------------------
  server.registerTool(
    "gas_regression_test",
    {
      title: "Gas regression testing",
      description:
        "Monitor for gas usage regressions by comparing against historical snapshots.",
      inputSchema: {
        baselineSnapshot: z
          .string()
          .optional()
          .describe("Path to baseline snapshot file (default: .gas-snapshot)"),
        threshold: z
          .number()
          .optional()
          .describe("Gas increase threshold percentage to flag as regression (default: 5)"),
        generateReport: z
          .boolean()
          .optional()
          .describe("Generate detailed regression report"),
        failOnRegression: z
          .boolean()
          .optional()
          .describe("Return failure if regression is detected")
      }
    },
    async ({ baselineSnapshot = ".gas-snapshot", threshold = 5, generateReport = true, failOnRegression = false }) => {
      // Run current snapshot
      const currentSnapshot = ".gas-snapshot-current";
      const snapshotArgs = ["snapshot", "--snap", currentSnapshot];
      const snapshotResult = await runForge(snapshotArgs);

      if (!snapshotResult.success) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              tool: "gas_regression_test",
              success: false,
              error: "Failed to generate current snapshot",
              stderr: snapshotResult.stderr
            }, null, 2)
          }],
          structuredContent: { success: false }
        };
      }

      // Compare with baseline
      const diffArgs = ["snapshot", "--diff", baselineSnapshot];
      const diffResult = await runForge(diffArgs);

      // Analyze for regressions (simplified analysis)
      const regressions = [];
      if (diffResult.stdout) {
        const lines = diffResult.stdout.split('\n');
        for (const line of lines) {
          if (line.includes('(gas:') && line.includes('(+')) {
            const match = line.match(/\(gas:\s*\+(\d+)\s*\(\+([0-9.]+)%\)\)/);
            if (match) {
              const percentIncrease = parseFloat(match[2]);
              if (percentIncrease > threshold) {
                regressions.push({
                  test: line.split(':')[0],
                  gasIncrease: parseInt(match[1]),
                  percentIncrease
                });
              }
            }
          }
        }
      }

      const hasRegressions = regressions.length > 0;
      const success = failOnRegression ? !hasRegressions : true;

      const payload = {
        tool: "gas_regression_test",
        projectRoot: PROJECT_ROOT,
        success,
        threshold,
        regressions,
        hasRegressions,
        totalRegressions: regressions.length,
        diffOutput: diffResult.stdout,
        recommendations: hasRegressions ? [
          "Review recent code changes that may have increased gas usage",
          "Run gas_profile_function on affected functions for detailed analysis",
          "Consider reverting changes if gas increase is not justified",
          "Update baseline snapshot if gas increase is intentional"
        ] : [
          "No gas regressions detected",
          "Consider updating baseline snapshot to current version"
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

  // --- Tool: gas_optimization_suggestions ------------------
  server.registerTool(
    "gas_optimization_suggestions",
    {
      title: "Gas optimization suggestions",
      description:
        "Analyze gas reports and provide specific optimization recommendations.",
      inputSchema: {
        contractName: z
          .string()
          .optional()
          .describe("Specific contract to analyze (if not provided, analyzes all)"),
        focusArea: z
          .enum(["deployment", "functions", "loops", "storage", "external_calls"])
          .optional()
          .describe("Focus analysis on specific optimization area")
      }
    },
    async ({ contractName, focusArea }) => {
      // Generate gas report first
      const reportArgs = ["test", "--gas-report"];
      if (contractName) {
        reportArgs.push("--match-contract", contractName);
      }

      const reportResult = await runForge(reportArgs);

      const optimizations = [];
      
      // General optimization suggestions based on focus area
      if (!focusArea || focusArea === "deployment") {
        optimizations.push({
          category: "Deployment Optimization",
          suggestions: [
            "Use --via-ir compilation for large contracts",
            "Increase optimizer_runs for frequently deployed contracts",
            "Consider splitting large contracts into smaller modules",
            "Remove unused imports and functions",
            "Use custom errors instead of string messages"
          ]
        });
      }

      if (!focusArea || focusArea === "functions") {
        optimizations.push({
          category: "Function Optimization",
          suggestions: [
            "Pack struct variables to minimize storage slots",
            "Use uint256 instead of smaller integers to avoid conversions",
            "Cache array lengths in loops",
            "Use assembly for simple operations in hot paths",
            "Prefer external over public for functions not called internally"
          ]
        });
      }

      if (!focusArea || focusArea === "loops") {
        optimizations.push({
          category: "Loop Optimization",
          suggestions: [
            "Cache array.length before loops",
            "Use unchecked blocks for loop counters when overflow is impossible",
            "Consider batch operations instead of individual calls in loops",
            "Pre-increment (++i) instead of post-increment (i++)",
            "Break early from loops when possible"
          ]
        });
      }

      if (!focusArea || focusArea === "storage") {
        optimizations.push({
          category: "Storage Optimization",
          suggestions: [
            "Pack multiple variables into single storage slots",
            "Use mappings instead of arrays when possible",
            "Delete storage variables when no longer needed",
            "Use constants and immutables instead of storage variables",
            "Minimize SSTORE operations by batching updates"
          ]
        });
      }

      if (!focusArea || focusArea === "external_calls") {
        optimizations.push({
          category: "External Call Optimization",
          suggestions: [
            "Batch multiple calls using multicall patterns",
            "Use staticcall for read-only external calls",
            "Cache external call results when possible",
            "Avoid unnecessary external calls in loops",
            "Use low-level calls for simple token transfers"
          ]
        });
      }

      const payload = {
        tool: "gas_optimization_suggestions",
        projectRoot: PROJECT_ROOT,
        success: reportResult.success,
        contractName: contractName || "all contracts",
        focusArea: focusArea || "general",
        gasReport: reportResult.stdout,
        optimizationSuggestions: optimizations,
        nextSteps: [
          "Implement suggested optimizations incrementally",
          "Use gas_compare_implementations to test optimization effectiveness",
          "Run gas_regression_test after changes to ensure no regressions",
          "Profile individual functions with gas_profile_function for detailed analysis"
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
