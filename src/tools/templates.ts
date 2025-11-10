import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PROJECT_ROOT } from "../utils.js";

// Foundry prompting template from https://getfoundry.sh/introduction/prompting
const FOUNDRY_SYSTEM_PROMPT = `<system_context>
You are an advanced assistant specialized in Ethereum smart contract development using Foundry. You have deep knowledge of Forge, Cast, Anvil, Chisel, Solidity best practices, modern smart contract development patterns, and advanced testing methodologies including fuzz testing and invariant testing.
</system_context>

<behavior_guidelines>
- Respond in a clear and professional manner
- Focus exclusively on Foundry-based solutions and tooling
- Provide complete, working code examples with proper imports
- Default to current Foundry and Solidity best practices
- Always include comprehensive testing approaches (unit, fuzz, invariant)
- Prioritize security and gas efficiency
- Ask clarifying questions when requirements are ambiguous
- Explain complex concepts and provide context for decisions
- Follow proper naming conventions and code organization patterns
- DO NOT write to or modify foundry.toml without asking. Explain which config property you are trying to add or change and why.
</behavior_guidelines>

<foundry_standards>
- Use Foundry's default project structure: src/ for contracts, test/ for tests, script/ for deployment scripts, lib/ for dependencies
- Write tests using Foundry's testing framework with forge-std
- Use named imports: import {Contract} from "src/Contract.sol"
- Follow NatSpec documentation standards for all public/external functions
- Use descriptive test names: test_RevertWhen_ConditionNotMet(), testFuzz_FunctionName(), invariant_PropertyName()
- Implement proper access controls and security patterns
- Always include error handling and input validation
- Use events for important state changes
- Optimize for readability over gas savings unless specifically requested
- Enable dynamic test linking for large projects: dynamic_test_linking = true
</foundry_standards>

<naming_conventions>
Contract Files:
- PascalCase for contracts: MyContract.sol, ERC20Token.sol
- Interface prefix: IMyContract.sol
- Abstract prefix: AbstractMyContract.sol
- Test suffix: MyContract.t.sol
- Script suffix: Deploy.s.sol, MyContractScript.s.sol

Functions and Variables:
- mixedCase for functions: deposit(), withdrawAll(), getUserBalance()
- mixedCase for variables: totalSupply, userBalances
- SCREAMING_SNAKE_CASE for constants: MAX_SUPPLY, INTEREST_RATE
- SCREAMING_SNAKE_CASE for immutables: OWNER, DEPLOYMENT_TIME
- PascalCase for structs: UserInfo, PoolData
- PascalCase for enums: Status, TokenType

Test Naming:
- test_FunctionName_Condition for unit tests
- test_RevertWhen_Condition for revert tests
- testFuzz_FunctionName for fuzz tests
- invariant_PropertyName for invariant tests
- testFork_Scenario for fork tests
</naming_conventions>

<testing_requirements>
Unit Testing:
- Write comprehensive test suites for all functionality
- Use test_ prefix for standard tests, testFuzz_ for fuzz tests
- Test both positive and negative cases (success and revert scenarios)
- Use vm.expectRevert() for testing expected failures
- Include setup functions that establish test state
- Use descriptive assertion messages: assertEq(result, expected, "error message")
- Test state changes, event emissions, and return values
- Write fork tests for integration with existing protocols
- Never place assertions in setUp() functions

Fuzz Testing:
- Use appropriate parameter types to avoid overflows (e.g., uint96 instead of uint256)
- Use vm.assume() to exclude invalid inputs rather than early returns
- Use fixtures for specific edge cases that must be tested
- Configure sufficient runs in foundry.toml: fuzz = { runs = 1000 }
- Test property-based behaviors rather than isolated scenarios

Invariant Testing:
- Use invariant_ prefix for invariant functions
- Implement handler-based testing for complex protocols
- Use ghost variables to track state across function calls
- Test with multiple actors using proper actor management
- Use bounded inputs with bound() function for controlled testing
- Configure appropriate runs, depth, and timeout values
- Examples: totalSupply == sum of balances, xy = k for AMMs
</testing_requirements>

<security_practices>
- Implement reentrancy protection where applicable (ReentrancyGuard)
- Use access control patterns (OpenZeppelin's Ownable, AccessControl)
- Validate all user inputs and external contract calls
- Follow CEI (Checks-Effects-Interactions) pattern
- Use safe math operations (Solidity 0.8+ has built-in overflow protection)
- Implement proper error handling for external calls
- Consider front-running and MEV implications
- Use time-based protections carefully (avoid block.timestamp dependencies)
- Implement proper slippage protection for DeFi applications
- Consider upgrade patterns carefully (proxy considerations)
- Run forge lint to catch security and style issues
- Address high-severity lints: incorrect-shift, divide-before-multiply
</security_practices>`;

export function registerTemplateTools(server: McpServer) {
  // --- Tool: generate_contract_prompt -------------------------
  server.registerTool(
    "generate_contract_prompt",
    {
      title: "Generate Foundry Contract Prompt",
      description: "Generate a structured prompt for AI tools to create smart contracts following Foundry best practices.",
      inputSchema: {
        requirements: z
          .string()
          .describe("Detailed requirements for the smart contract you want to create"),
        contractType: z
          .enum(["token", "vault", "defi", "nft", "governance", "proxy", "custom"])
          .optional()
          .describe("Type of contract to generate (helps with specific patterns)"),
        includeTests: z
          .boolean()
          .optional()
          .describe("Whether to include comprehensive testing requirements (default: true)"),
        includeDeployment: z
          .boolean()
          .optional()
          .describe("Whether to include deployment script requirements (default: true)"),
        securityLevel: z
          .enum(["basic", "standard", "high"])
          .optional()
          .describe("Security requirements level (default: standard)")
      }
    },
    async ({ requirements, contractType = "custom", includeTests = true, includeDeployment = true, securityLevel = "standard" }) => {
      let specificGuidelines = "";
      
      // Add contract-type specific guidelines
      switch (contractType) {
        case "token":
          specificGuidelines += `
<token_specific>
- Implement ERC20 standard with proper decimals handling
- Include minting/burning functionality if required
- Consider permit functionality for gasless approvals
- Implement proper access controls for admin functions
- Include transfer restrictions if needed (pausing, blacklisting)
- Add comprehensive allowance testing
</token_specific>`;
          break;
        case "vault":
          specificGuidelines += `
<vault_specific>
- Implement ERC4626 standard for vault functionality
- Include proper share calculation and rounding protection
- Implement deposit/withdraw limits and fees
- Add emergency pause functionality
- Include yield generation mechanism
- Test invariants: totalSupply relationships, share calculations
</vault_specific>`;
          break;
        case "defi":
          specificGuidelines += `
<defi_specific>
- Implement proper oracle integration with price feeds
- Include slippage protection mechanisms
- Add liquidity management functions
- Implement proper MEV protection
- Include emergency pause and circuit breakers
- Test with forked mainnet state for realistic conditions
</defi_specific>`;
          break;
        case "nft":
          specificGuidelines += `
<nft_specific>
- Implement ERC721 or ERC1155 standard
- Include proper metadata URI handling
- Add royalty support (ERC2981)
- Implement minting restrictions and limits
- Include proper access controls for minting
- Add comprehensive tokenId testing
</nft_specific>`;
          break;
        case "governance":
          specificGuidelines += `
<governance_specific>
- Implement proper voting mechanisms with delegation
- Include timelock functionality for proposal execution
- Add quorum and threshold requirements
- Implement proper proposal lifecycle management
- Include vote weight calculation mechanisms
- Test governance attack vectors and edge cases
</governance_specific>`;
          break;
      }

      // Add security level specific requirements
      if (securityLevel === "high") {
        specificGuidelines += `
<high_security>
- Implement multi-signature requirements for critical functions
- Add comprehensive access control with role-based permissions
- Include extensive input validation and boundary checks
- Implement proper upgrade patterns with timelock delays
- Add monitoring and alerting mechanisms
- Include formal verification considerations
- Conduct thorough security reviews and audits
</high_security>`;
      }

      const fullPrompt = `${FOUNDRY_SYSTEM_PROMPT}

${specificGuidelines}

<user_prompt>
${requirements}

${includeTests ? "- Include comprehensive testing (unit, fuzz, invariant)" : ""}
${includeDeployment ? "- Include deployment script with verification" : ""}
- Follow all Foundry best practices and security guidelines
- Provide complete implementation with proper project structure
${contractType !== "custom" ? `- Focus on ${contractType} contract patterns and standards` : ""}
</user_prompt>`;

      const payload = {
        tool: "generate_contract_prompt",
        projectRoot: PROJECT_ROOT,
        success: true,
        contractType,
        securityLevel,
        prompt: fullPrompt,
        instructions: "Copy this prompt and paste it into your AI tool (ChatGPT, Claude, etc.) to generate a Foundry-compliant smart contract."
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

  // --- Tool: foundry_project_template -----------------------
  server.registerTool(
    "foundry_project_template",
    {
      title: "Generate Foundry Project Structure",
      description: "Generate a complete Foundry project structure with best practices configuration.",
      inputSchema: {
        contractName: z
          .string()
          .describe("Name of the main contract (PascalCase)"),
        projectName: z
          .string()
          .optional()
          .describe("Project name (defaults to contract name in lowercase)"),
        includeOpenZeppelin: z
          .boolean()
          .optional()
          .describe("Include OpenZeppelin contracts dependency (default: true)"),
        includeSolmate: z
          .boolean()
          .optional()
          .describe("Include Solmate contracts dependency (default: false)"),
        solcVersion: z
          .string()
          .optional()
          .describe("Solidity compiler version (default: 0.8.20)")
      }
    },
    async ({ contractName, projectName, includeOpenZeppelin = true, includeSolmate = false, solcVersion = "0.8.20" }) => {
      const projectNameLower = projectName || contractName.toLowerCase();
      
      // Generate foundry.toml
      const foundryToml = `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
dynamic_test_linking = true

# Compiler settings
solc_version = "${solcVersion}"
optimizer = true
optimizer_runs = 200
via_ir = false

# Testing configuration
gas_reports = ["*"]
ffi = false
fs_permissions = [{ access = "read", path = "./" }]

# Fuzz testing
[fuzz]
runs = 1000
max_test_rejects = 65536

# Invariant testing
[invariant]
runs = 256
depth = 15
fail_on_revert = false
show_metrics = true

# Linting
[lint]
exclude_lints = []

[rpc_endpoints]
mainnet = "\${MAINNET_RPC_URL}"
sepolia = "\${SEPOLIA_RPC_URL}"
arbitrum = "\${ARBITRUM_RPC_URL}"
polygon = "\${POLYGON_RPC_URL}"

[etherscan]
mainnet = { key = "\${ETHERSCAN_API_KEY}" }
sepolia = { key = "\${ETHERSCAN_API_KEY}" }
arbitrum = { key = "\${ARBISCAN_API_KEY}", url = "https://api.arbiscan.io/api" }
polygon = { key = "\${POLYGONSCAN_API_KEY}", url = "https://api.polygonscan.com/api" }`;

      // Generate .env.example
      const envExample = `# RPC URLs
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Private key for deployment (use with caution)
PRIVATE_KEY=0x...`;

      // Generate basic contract template
      const contractTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ${contractName}
 * @dev Brief description of what this contract does
 * @author Your name
 */
contract ${contractName} {
    /// @dev Event emitted when something important happens
    event SomethingHappened(address indexed user, uint256 value);
    
    /// @dev Custom error for better gas efficiency
    error ${contractName}__InvalidInput();
    
    /// @dev State variable example
    mapping(address => uint256) public userBalances;
    
    /**
     * @notice Brief description of this function
     * @dev Detailed technical description
     * @param user The address of the user
     * @param amount The amount to process
     */
    function exampleFunction(address user, uint256 amount) external {
        if (user == address(0) || amount == 0) {
            revert ${contractName}__InvalidInput();
        }
        
        userBalances[user] += amount;
        emit SomethingHappened(user, amount);
    }
}`;

      // Generate test template
      const testTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {${contractName}} from "src/${contractName}.sol";

contract ${contractName}Test is Test {
    ${contractName} public ${contractName.toLowerCase()};
    
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    
    function setUp() public {
        ${contractName.toLowerCase()} = new ${contractName}();
    }
    
    function test_ExampleFunction() public {
        uint256 amount = 100;
        
        vm.expectEmit(true, true, false, true);
        emit ${contractName}.SomethingHappened(user1, amount);
        
        ${contractName.toLowerCase()}.exampleFunction(user1, amount);
        
        assertEq(${contractName.toLowerCase()}.userBalances(user1), amount);
    }
    
    function test_RevertWhen_InvalidInput() public {
        vm.expectRevert(${contractName}.${contractName}__InvalidInput.selector);
        ${contractName.toLowerCase()}.exampleFunction(address(0), 100);
        
        vm.expectRevert(${contractName}.${contractName}__InvalidInput.selector);
        ${contractName.toLowerCase()}.exampleFunction(user1, 0);
    }
    
    function testFuzz_ExampleFunction(address user, uint96 amount) public {
        vm.assume(user != address(0));
        vm.assume(amount > 0);
        
        ${contractName.toLowerCase()}.exampleFunction(user, amount);
        assertEq(${contractName.toLowerCase()}.userBalances(user), amount);
    }
}`;

      // Generate deployment script
      const deployScript = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {${contractName}} from "src/${contractName}.sol";

contract Deploy${contractName}Script is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ${contractName} ${contractName.toLowerCase()} = new ${contractName}();
        
        console.log("${contractName} deployed to:", address(${contractName.toLowerCase()}));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
    }
}`;

      // Generate setup commands
      const setupCommands = [
        `forge init ${projectNameLower}`,
        `cd ${projectNameLower}`,
        ...(includeOpenZeppelin ? [`forge install OpenZeppelin/openzeppelin-contracts@v5.0.0`] : []),
        ...(includeSolmate ? [`forge install transmissions11/solmate`] : []),
        `forge build`,
        `forge test`
      ];

      const payload = {
        tool: "foundry_project_template",
        projectRoot: PROJECT_ROOT,
        success: true,
        projectName: projectNameLower,
        contractName,
        files: {
          "foundry.toml": foundryToml,
          ".env.example": envExample,
          [`src/${contractName}.sol`]: contractTemplate,
          [`test/${contractName}.t.sol`]: testTemplate,
          [`script/Deploy${contractName}.s.sol`]: deployScript
        },
        setupCommands,
        nextSteps: [
          "Create the project structure with the provided files",
          "Copy .env.example to .env and fill in your values",
          "Run forge install to set up dependencies",
          "Customize the contract implementation for your needs",
          "Run forge test to verify everything works",
          "Use the generate_contract_prompt tool for AI assistance"
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
