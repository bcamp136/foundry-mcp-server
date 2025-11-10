# Chisel Integration Tools

The Foundry MCP server now includes comprehensive Chisel REPL integration for interactive Solidity development and debugging. These tools leverage Chisel's powerful features to provide an enhanced development experience.

## Available Tools

### 1. `chisel_execute_code`
Execute Solidity expressions or statements in an interactive Chisel session.

**Features:**
- Run individual expressions or multi-line statements
- Session management (load/save sessions)
- Fork mainnet for testing with real state
- Enable execution traces for debugging
- Automatic state persistence

**Example Usage:**
```typescript
// Execute a simple expression
chisel_execute_code({ 
  code: "uint256(123) + 456" 
})

// Execute with mainnet fork
chisel_execute_code({ 
  code: "IERC20(0xA0b86a33E6)..balanceOf(address(this))",
  forkUrl: "https://rpc.ankr.com/eth",
  enableTraces: true
})

// Multi-statement with session save
chisel_execute_code({
  code: "uint256 x = 100; uint256 y = x * 2;",
  saveSession: true,
  sessionId: "my_experiment"
})
```

### 2. `chisel_debug_expression`
Advanced debugging with memory and stack inspection.

**Features:**
- Memory dumps showing raw memory layout
- Stack dumps revealing EVM stack state
- Variable inspection with raw stack analysis
- Step-by-step execution traces
- Fork debugging with real blockchain state

**Example Usage:**
```typescript
// Full debugging with memory and stack analysis
chisel_debug_expression({
  code: "bytes32 hash = keccak256('hello'); uint256 num = uint256(hash);",
  debugLevel: "full",
  variables: ["hash", "num"],
  forkUrl: "https://rpc.ankr.com/eth"
})
```

### 3. `chisel_fetch_interface`
Fetch verified contract interfaces from Etherscan.

**Features:**
- Automatic interface generation from verified contracts
- Session persistence for reuse
- Test function calls against real contracts
- Mainnet fork integration

**Example Usage:**
```typescript
// Fetch USDC interface and test a function
chisel_fetch_interface({
  contractAddress: "0xA0b86a33E6081C04112da93aE1716f70E7b0c92c",
  interfaceName: "IERC20",
  testCall: "IERC20(0xA0b86a33E6)..totalSupply()",
  saveSession: true
})
```

### 4. `chisel_session_manager`
Comprehensive session management for persistent development.

**Features:**
- List all saved sessions
- Load/save/view sessions
- Export sessions to Foundry scripts
- Clear cache and manage storage

**Example Usage:**
```typescript
// List all available sessions
chisel_session_manager({ action: "list" })

// Load and view a specific session
chisel_session_manager({ 
  action: "load", 
  sessionId: "my_experiment" 
})

// Export session to Foundry script
chisel_session_manager({
  action: "export",
  sessionId: "my_experiment"
})
```

### 5. `chisel_experiment_builder`
Build complex multi-step Solidity experiments.

**Features:**
- Structured experiment definition
- Multi-step setup and testing
- Variable inspection and debugging
- Session persistence
- Fork testing capabilities

**Example Usage:**
```typescript
// Complex DeFi interaction experiment
chisel_experiment_builder({
  experiment: {
    name: "UniswapV3Analysis",
    description: "Analyze Uniswap V3 pool mechanics",
    setup: [
      "address pool = 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640;",
      "IUniswapV3Pool uniPool = IUniswapV3Pool(pool);"
    ],
    tests: [
      "(uint160 sqrtPrice,,,,,,) = uniPool.slot0();",
      "uint128 liquidity = uniPool.liquidity();",
      "address token0 = uniPool.token0();",
      "address token1 = uniPool.token1();"
    ],
    variables: ["sqrtPrice", "liquidity", "token0", "token1"],
    fork: "https://rpc.ankr.com/eth"
  },
  saveExperiment: true,
  enableDebugging: true
})
```

## Integration with Gas Analysis

Chisel tools work seamlessly with the gas analysis pipeline:

1. **Prototype in Chisel** - Use `chisel_execute_code` to rapidly prototype contract logic
2. **Debug with traces** - Use `chisel_debug_expression` to understand execution flow
3. **Export to script** - Use `chisel_session_manager` to export working code
4. **Analyze gas usage** - Use `forge_gas_report` and related tools to optimize

## Development Workflow

### Interactive Contract Development
```typescript
// 1. Start with basic logic in Chisel
chisel_execute_code({
  code: "contract SimpleStorage { uint256 value; function set(uint256 _value) public { value = _value; } }",
  saveSession: true,
  sessionId: "simple_storage"
})

// 2. Test the logic
chisel_execute_code({
  code: "SimpleStorage storage = SimpleStorage(address(this)); storage.set(42); storage.value()",
  sessionId: "simple_storage"
})

// 3. Export to proper contract
chisel_session_manager({
  action: "export",
  sessionId: "simple_storage"
})
```

### DeFi Protocol Analysis
```typescript
// 1. Fetch protocol interfaces
chisel_fetch_interface({
  contractAddress: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9", // Aave LendingPool
  interfaceName: "ILendingPool",
  saveSession: true,
  sessionId: "aave_analysis"
})

// 2. Analyze with real state
chisel_experiment_builder({
  experiment: {
    name: "AaveAnalysis",
    description: "Analyze Aave lending rates and reserves",
    setup: ["ILendingPool pool = ILendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);"],
    tests: [
      "address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;",
      "DataTypes.ReserveData memory reserve = pool.getReserveData(weth);",
      "uint256 liquidityRate = reserve.currentLiquidityRate;",
      "uint256 stableBorrowRate = reserve.currentStableBorrowRate;"
    ],
    variables: ["liquidityRate", "stableBorrowRate"],
    fork: "https://rpc.ankr.com/eth"
  },
  saveExperiment: true
})
```

## Advanced Features

### Memory and Stack Analysis
- Chisel provides deep EVM introspection
- Memory dumps show exact layout after execution
- Stack analysis reveals variable storage for types < 32 bytes
- Raw stack inspection shows actual memory addresses

### Session Persistence
- All experiments can be saved and reloaded
- Sessions persist across multiple tool calls
- Export capability allows moving to production code
- Cross-tool session sharing enables complex workflows

### Real-world Testing
- Fork any RPC endpoint for testing
- Access live contract state during development
- Test against real DeFi protocols and tokens
- Debug transactions with actual blockchain context

## Best Practices

1. **Start Small**: Begin with simple expressions before building complex logic
2. **Use Sessions**: Save important experiments for future reference
3. **Enable Debugging**: Use traces and memory dumps for complex logic
4. **Fork Strategically**: Use mainnet forks when testing with real protocols
5. **Export When Ready**: Move successful experiments to proper Foundry scripts
6. **Combine Tools**: Use Chisel with gas analysis and other Foundry tools for complete workflow

## Integration with AI Development

The Chisel tools integrate perfectly with AI-assisted development:

- **Rapid Prototyping**: Test AI-generated code snippets instantly
- **Interactive Debugging**: Step through AI suggestions with full visibility
- **Real-world Validation**: Test AI code against actual blockchain state
- **Iterative Improvement**: Save sessions to build upon AI suggestions
- **Educational Tool**: Learn from AI explanations with hands-on experimentation

## Example Prompts for GitHub Copilot

Here are practical prompts you can use with GitHub Copilot to leverage the Chisel tools:

### **🎯 Interactive Testing & Prototyping**

**Basic Math and Logic Testing:**
```
"I want to test some Solidity math calculations interactively. Can you use Chisel to calculate compound interest with these values: principal = 1000 ether, rate = 5% annual, time = 2 years?"
```

**Data Type Exploration:**
```
"I want to understand how Solidity handles different data types. Create a Chisel experiment that tests string, bytes, and address conversions, and save it as a session called 'data_types_learning'."
```

### **🌐 DeFi Protocol Analysis**

**Uniswap Analysis:**
```
"Use Chisel to fetch the Uniswap V3 USDC/WETH pool interface and analyze the current liquidity and price. The pool address is 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640. I want to see the current sqrt price and total liquidity."
```

**Token Balance Checking:**
```
"Use Chisel to fetch the USDC token interface and check the balance of Vitalik's address (vitalik.eth) on mainnet. Also show me the total supply and decimals."
```

**Multi-Protocol Comparison:**
```
"Build a comprehensive Chisel experiment that: 1) Fetches Compound's cToken interface, 2) Checks current exchange rate, 3) Calculates potential earnings, 4) Tests the math with different amounts. Save this as 'compound_analysis'."
```

### **🔍 Advanced Debugging**

**Memory and Stack Investigation:**
```
"I'm having trouble with a bytes32 to uint256 conversion. Can you use Chisel with full debugging to show me exactly what happens in memory when I do: bytes32 hash = keccak256('hello world'); uint256 num = uint256(hash);"
```

**Complex State Changes:**
```
"Debug this complex calculation with memory inspection: mapping(address => uint256) balances; balances[msg.sender] += amount; uint256 newBalance = balances[msg.sender]; - I want to see the stack and memory dumps."
```

### **📚 Learning & Education**

**Cryptography Deep Dive:**
```
"I want to understand how Ethereum addresses are generated. Use Chisel to show me step-by-step: 1) Generate a private key, 2) Derive the public key, 3) Hash to get the address, with full debugging traces showing each step."
```

**Gas Optimization Research:**
```
"I want to compare gas usage of different loop patterns. Create a Chisel experiment that tests 'for' loops vs 'while' loops vs assembly loops for summing 1 to 100, then export it so I can use it in gas analysis."
```

### **💾 Session Management**

**Session Workflow:**
```
"Show me all my saved Chisel sessions, then load the one called 'defi_experiments' and add some new Aave lending pool analysis to it."
```

**Export to Production:**
```
"Load my 'uniswap_testing' Chisel session and export it to a proper Foundry script that I can use in my project."
```

### **🎭 Effective Prompt Patterns**

**"Interactive Testing" Pattern:**
- "Use Chisel to test..."
- "I want to experiment with..."
- "Can you prototype this logic in Chisel..."

**"Real-world Analysis" Pattern:**
- "Fetch the [PROTOCOL] interface and analyze..."
- "Use mainnet fork to test..."
- "Check the current state of [CONTRACT]..."

**"Debugging Investigation" Pattern:**
- "Debug this with memory dumps..."
- "Show me the stack trace for..."
- "I need to understand why [CODE] behaves..."

**"Learning & Exploration" Pattern:**
- "I want to understand how [CONCEPT] works..."
- "Create an experiment that demonstrates..."
- "Help me learn [TOPIC] with interactive examples..."

**"Session Workflow" Pattern:**
- "Save this experiment as..."
- "Load my [SESSION_NAME] session and..."
- "Export my Chisel work to a Foundry script..."

### **💡 Pro Tips for Chisel Prompts**

1. **Be Specific**: Mention contract addresses, function names, or exact calculations
2. **Request Debugging**: Ask for "with full debugging" or "show memory dumps" for complex logic
3. **Use Sessions**: Mention saving/loading sessions for multi-step work
4. **Fork When Needed**: Specify mainnet fork for real contract interactions
5. **Combine Tools**: Ask to "then use gas analysis" or "export to Foundry script"
6. **Iterative Development**: Build on previous experiments by referencing saved sessions
7. **Educational Focus**: Ask for step-by-step explanations with interactive demonstrations
