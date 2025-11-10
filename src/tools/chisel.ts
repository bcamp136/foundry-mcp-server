import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execFile, spawn, ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { PROJECT_ROOT } from "../utils.js";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

// Helper function to run chisel with script input
async function runChiselWithScript(script: string[]): Promise<{stdout: string, stderr: string}> {
  return new Promise((resolve, reject) => {
    const chisel = spawn("chisel", [], {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    chisel.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    chisel.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    chisel.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Chisel exited with code ${code}: ${stderr}`));
      }
    });

    chisel.on('error', (error) => {
      reject(error);
    });

    // Send the script to chisel
    chisel.stdin.write(script.join('\n') + '\n');
    chisel.stdin.end();
  });
}

export function registerChiselTools(server: McpServer) {
  // --- Tool: chisel_execute_code ------------------------------
  server.registerTool(
    "chisel_execute_code",
    {
      title: "Execute Solidity code in Chisel REPL",
      description:
        "Execute Solidity expressions or statements in an interactive Chisel session.",
      inputSchema: {
        code: z
          .string()
          .describe("Solidity code to execute (expression or statement)"),
        sessionId: z
          .string()
          .optional()
          .describe("Optional session ID to load existing session"),
        saveSession: z
          .boolean()
          .optional()
          .describe("Save the session after execution for future use"),
        enableTraces: z
          .boolean()
          .optional()
          .describe("Enable execution traces for debugging"),
        forkUrl: z
          .string()
          .optional()
          .describe("Fork from this RPC URL for mainnet state")
      }
    },
    async ({ code, sessionId, saveSession = false, enableTraces = false, forkUrl }) => {
      try {
        // Create a temporary script to automate chisel interaction
        const chiselScript = [];
        
        // Load session if specified
        if (sessionId) {
          chiselScript.push(`!load ${sessionId}`);
        }
        
        // Fork if specified
        if (forkUrl) {
          chiselScript.push(`!fork ${forkUrl}`);
        }
        
        // Enable traces if requested
        if (enableTraces) {
          chiselScript.push(`!traces`);
        }
        
        // Add the code to execute
        chiselScript.push(code);
        
        // Show source if it's a statement
        if (code.includes('=') || code.includes('function') || code.includes('contract')) {
          chiselScript.push(`!source`);
        }
        
        // Save session if requested
        if (saveSession) {
          const saveId = sessionId || `session_${Date.now()}`;
          chiselScript.push(`!save ${saveId}`);
        }
        
        // Quit chisel
        chiselScript.push(`!quit`);
        
        // Write script to temporary file
        const scriptPath = path.join(PROJECT_ROOT, `.chisel_script_${Date.now()}.txt`);
        writeFileSync(scriptPath, chiselScript.join('\n'));
        
        // Execute chisel with the script
        const result = await runChiselWithScript(chiselScript);
        
        // Clean up temporary script
        try {
          require('fs').unlinkSync(scriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        const payload = {
          tool: "chisel_execute_code",
          projectRoot: PROJECT_ROOT,
          success: true,
          code,
          sessionId: saveSession ? (sessionId || `session_${Date.now()}`) : sessionId,
          stdout: result.stdout,
          stderr: result.stderr,
          executionNotes: [
            "Expressions return immediate values without persisting state",
            "Statements (ending with ;) persist in the session",
            "Use !source to see the generated contract code",
            "Enable traces to see detailed execution information"
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
        
      } catch (err: any) {
        const payload = {
          tool: "chisel_execute_code",
          projectRoot: PROJECT_ROOT,
          success: false,
          error: err.message,
          stderr: err.stderr?.toString?.() ?? ""
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

  // --- Tool: chisel_debug_expression --------------------------
  server.registerTool(
    "chisel_debug_expression",
    {
      title: "Debug Solidity expression with memory/stack dumps",
      description:
        "Execute code in Chisel with detailed debugging information including memory and stack dumps.",
      inputSchema: {
        code: z
          .string()
          .describe("Solidity code to debug"),
        debugLevel: z
          .enum(["basic", "memory", "stack", "full"])
          .optional()
          .describe("Level of debugging detail"),
        variables: z
          .array(z.string())
          .optional()
          .describe("Variable names to inspect with !rawstack"),
        forkUrl: z
          .string()
          .optional()
          .describe("Fork from RPC for debugging with real state")
      }
    },
    async ({ code, debugLevel = "basic", variables = [], forkUrl }) => {
      try {
        const chiselScript = [];
        
        if (forkUrl) {
          chiselScript.push(`!fork ${forkUrl}`);
        }
        
        // Always enable traces for debugging
        chiselScript.push(`!traces`);
        
        // Execute the code
        chiselScript.push(code);
        
        // Add debugging commands based on level
        if (debugLevel === "memory" || debugLevel === "full") {
          chiselScript.push(`!memdump`);
        }
        
        if (debugLevel === "stack" || debugLevel === "full") {
          chiselScript.push(`!stackdump`);
        }
        
        // Inspect specific variables
        for (const variable of variables) {
          chiselScript.push(`!rawstack ${variable}`);
        }
        
        // Show the source
        chiselScript.push(`!source`);
        chiselScript.push(`!quit`);
        
        const result = await runChiselWithScript(chiselScript);
        
        const payload = {
          tool: "chisel_debug_expression",
          projectRoot: PROJECT_ROOT,
          success: true,
          code,
          debugLevel,
          inspectedVariables: variables,
          stdout: result.stdout,
          stderr: result.stderr,
          debuggingTips: [
            "Memory dump shows the raw memory layout after execution",
            "Stack dump reveals the EVM stack state",
            "Raw stack shows actual variable storage for < 32 byte variables",
            "Traces provide step-by-step execution details"
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
        
      } catch (err: any) {
        const payload = {
          tool: "chisel_debug_expression",
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

  // --- Tool: chisel_fetch_interface ----------------------------
  server.registerTool(
    "chisel_fetch_interface",
    {
      title: "Fetch verified contract interface",
      description:
        "Fetch the interface of a verified contract from Etherscan and make it available in Chisel.",
      inputSchema: {
        contractAddress: z
          .string()
          .describe("Address of the verified contract on Ethereum mainnet"),
        interfaceName: z
          .string()
          .describe("Name to assign to the interface in Chisel"),
        sessionId: z
          .string()
          .optional()
          .describe("Session ID to load/save"),
        saveSession: z
          .boolean()
          .optional()
          .describe("Save session after fetching interface"),
        testCall: z
          .string()
          .optional()
          .describe("Optional function call to test the interface")
      }
    },
    async ({ contractAddress, interfaceName, sessionId, saveSession = false, testCall }) => {
      try {
        const chiselScript = [];
        
        if (sessionId) {
          chiselScript.push(`!load ${sessionId}`);
        }
        
        // Fetch the interface
        chiselScript.push(`!fetch ${contractAddress} ${interfaceName}`);
        
        // Test a function call if provided
        if (testCall) {
          chiselScript.push(`!fork https://rpc.ankr.com/eth`);
          chiselScript.push(testCall);
        }
        
        // Show the source to see the interface
        chiselScript.push(`!source`);
        
        if (saveSession) {
          const saveId = sessionId || `interface_${interfaceName}_${Date.now()}`;
          chiselScript.push(`!save ${saveId}`);
        }
        
        chiselScript.push(`!quit`);
        
        const result = await runChiselWithScript(chiselScript);
        
        const payload = {
          tool: "chisel_fetch_interface",
          projectRoot: PROJECT_ROOT,
          success: true,
          contractAddress,
          interfaceName,
          testCall,
          sessionId: saveSession ? (sessionId || `interface_${interfaceName}_${Date.now()}`) : sessionId,
          stdout: result.stdout,
          stderr: result.stderr,
          usageNotes: [
            "Interface is now available in your Chisel session",
            "You can interact with the contract using the interface",
            "Fork mainnet to test actual contract interactions",
            "Save the session to reuse the interface later"
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
        
      } catch (err: any) {
        const payload = {
          tool: "chisel_fetch_interface",
          success: false,
          error: err.message,
          troubleshooting: [
            "Ensure the contract address is verified on Etherscan",
            "Only Ethereum mainnet contracts are currently supported",
            "Check that the address format is correct (0x...)"
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
    }
  );

  // --- Tool: chisel_session_manager ----------------------------
  server.registerTool(
    "chisel_session_manager",
    {
      title: "Manage Chisel sessions",
      description:
        "List, load, save, and manage Chisel sessions for persistent experimentation.",
      inputSchema: {
        action: z
          .enum(["list", "load", "save", "view", "clear_cache", "export"])
          .describe("Session management action"),
        sessionId: z
          .string()
          .optional()
          .describe("Session ID for load/save/view/export actions"),
        newSessionName: z
          .string()
          .optional()
          .describe("Name for saving a new session")
      }
    },
    async ({ action, sessionId, newSessionName }) => {
      try {
        let result;
        
        switch (action) {
          case "list":
            result = await execFileAsync("chisel", ["list"], {
              cwd: PROJECT_ROOT,
              env: process.env
            });
            break;
            
          case "view":
            if (!sessionId) {
              throw new Error("Session ID required for view action");
            }
            result = await execFileAsync("chisel", ["view", sessionId], {
              cwd: PROJECT_ROOT,
              env: process.env
            });
            break;
            
          case "clear_cache":
            result = await execFileAsync("chisel", ["clear-cache"], {
              cwd: PROJECT_ROOT,
              env: process.env
            });
            break;
            
          case "load":
            if (!sessionId) {
              throw new Error("Session ID required for load action");
            }
            // For load, we need interactive mode
            const loadScript = [`!load ${sessionId}`, `!source`, `!quit`];
            result = await runChiselWithScript(loadScript);
            break;
            
          case "save":
            // This requires an active session, so we'll document how to use it
            const saveScript = [`!save ${newSessionName || sessionId || 'default'}`, `!quit`];
            result = await runChiselWithScript(saveScript);
            break;
            
          case "export":
            if (!sessionId) {
              throw new Error("Session ID required for export action");
            }
            const exportScript = [`!load ${sessionId}`, `!export`, `!quit`];
            result = await runChiselWithScript(exportScript);
            break;
            
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        const payload = {
          tool: "chisel_session_manager",
          projectRoot: PROJECT_ROOT,
          success: true,
          action,
          sessionId,
          stdout: result.stdout,
          stderr: result.stderr,
          sessionTips: [
            "Sessions persist your Solidity state across Chisel runs",
            "Use descriptive session names for better organization",
            "Export sessions to Foundry scripts for permanent storage",
            "Sessions are stored in ~/.foundry/cache/chisel/"
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
        
      } catch (err: any) {
        const payload = {
          tool: "chisel_session_manager",
          success: false,
          action,
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

  // --- Tool: chisel_experiment_builder ------------------------
  server.registerTool(
    "chisel_experiment_builder",
    {
      title: "Build complex Solidity experiments",
      description:
        "Create multi-step Solidity experiments for testing complex logic, gas optimization, or learning.",
      inputSchema: {
        experiment: z
          .object({
            name: z.string().describe("Name of the experiment"),
            description: z.string().describe("Description of what this tests"),
            setup: z.array(z.string()).optional().describe("Setup code statements"),
            tests: z.array(z.string()).describe("Test expressions/statements"),
            variables: z.array(z.string()).optional().describe("Variables to inspect"),
            fork: z.string().optional().describe("Fork URL for testing with real state")
          })
          .describe("Experiment configuration"),
        saveExperiment: z
          .boolean()
          .optional()
          .describe("Save the experiment as a session"),
        enableDebugging: z
          .boolean()
          .optional()
          .describe("Enable detailed debugging output")
      }
    },
    async ({ experiment, saveExperiment = false, enableDebugging = false }) => {
      try {
        const chiselScript = [];
        
        // Fork if specified
        if (experiment.fork) {
          chiselScript.push(`!fork ${experiment.fork}`);
        }
        
        // Enable traces if debugging
        if (enableDebugging) {
          chiselScript.push(`!traces`);
        }
        
        // Add setup code
        if (experiment.setup) {
          chiselScript.push(`// === SETUP: ${experiment.description} ===`);
          for (const setupLine of experiment.setup) {
            chiselScript.push(setupLine);
          }
        }
        
        // Add test code
        chiselScript.push(`// === TESTS ===`);
        for (const testLine of experiment.tests) {
          chiselScript.push(testLine);
        }
        
        // Inspect variables
        if (experiment.variables) {
          chiselScript.push(`// === VARIABLE INSPECTION ===`);
          for (const variable of experiment.variables) {
            chiselScript.push(variable); // Show the variable value
            if (enableDebugging) {
              chiselScript.push(`!rawstack ${variable}`);
            }
          }
        }
        
        // Show the generated source
        chiselScript.push(`!source`);
        
        // Save if requested
        if (saveExperiment) {
          const experimentId = `exp_${experiment.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
          chiselScript.push(`!save ${experimentId}`);
        }
        
        chiselScript.push(`!quit`);
        
        const result = await runChiselWithScript(chiselScript);
        
        const payload = {
          tool: "chisel_experiment_builder",
          projectRoot: PROJECT_ROOT,
          success: true,
          experiment,
          sessionId: saveExperiment ? `exp_${experiment.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}` : null,
          stdout: result.stdout,
          stderr: result.stderr,
          experimentalFeatures: [
            "Multi-step testing with persistent state",
            "Variable inspection and debugging",
            "Fork testing with real blockchain state",
            "Automated experiment execution and documentation"
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
        
      } catch (err: any) {
        const payload = {
          tool: "chisel_experiment_builder",
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
}
