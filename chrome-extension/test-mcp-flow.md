# MCP System Test Flow

## Expected Behavior

### 🚀 **First Request (Learning Phase)**
1. User sends consultation request (e.g., "Schedule a consultation with Prof. Trajanov")
2. MCP server checks for learned actions → **None found**
3. **Normal execution starts**:
   - **Planner**: Creates execution plan
   - **Navigator**: Executes concrete actions (click, type, navigate)
   - **Validator**: Validates results
4. **After execution**: MCP learns from agent history and stores action patterns
5. **Result**: Task completed + Actions learned

### 🔄 **Second Similar Request (Serving Phase)**
1. User sends similar consultation request
2. MCP server finds learned actions → **Similarity match found**
3. **MCP serves learned actions** (skips agent pipeline)
4. **Result**: Task completed much faster using learned actions

## Test Steps

### **Step 1: First Execution (Learning)**
```javascript
// Send first consultation request
const response1 = await chrome.runtime.sendMessage({ 
  type: 'mcp_consultation_request',
  task: 'Schedule a consultation with Prof. Trajanov',
  tabId: 1,
  taskId: 'consultation_1'
});

// Expected: usedLearnedActions: false
// Expected: message: 'Executed with agents - learned from this execution'
```

### **Step 2: Check Learning**
```javascript
// Check if actions were learned
const stats = await chrome.runtime.sendMessage({ type: 'mcp_stats' });
// Expected: totalTasksLearned: 1, totalActionsStored: >0

const actions = await chrome.runtime.sendMessage({ type: 'mcp_get_actions' });
// Expected: actions.length > 0
```

### **Step 3: Second Execution (Serving)**
```javascript
// Send similar consultation request
const response2 = await chrome.runtime.sendMessage({ 
  type: 'mcp_consultation_request',
  task: 'Schedule a consultation with Prof. Trajanov',
  tabId: 1,
  taskId: 'consultation_2'
});

// Expected: usedLearnedActions: true
// Expected: result with learned actions
```

## Console Test Commands

```javascript
// Load test functions
// Copy and paste the contents of test-mcp-console.js into console

// Test the complete flow
window.testMCP.all();

// Or test step by step
await window.testMCP.stats();        // Check initial state
await window.testMCP.consultation(); // First execution (learning)
await window.testMCP.stats();        // Check if learned
await window.testMCP.consultation(); // Second execution (serving)
```

## Expected Console Output

```
🧪 Testing MCP System...
🚀 Running all MCP tests...

📊 Testing MCP Stats...
✅ MCP Stats working!
Stats: { totalTasksLearned: 0, totalActionsStored: 0, ... }

🔍 Testing MCP Consultation...
✅ MCP Consultation working!
Used learned actions: false
Message: Executed with agents - learned from this execution

📊 Testing MCP Stats...
✅ MCP Stats working!
Stats: { totalTasksLearned: 1, totalActionsStored: 5, ... }

🔍 Testing MCP Consultation...
✅ MCP Consultation working!
Used learned actions: true
Result: { success: true, results: [...] }

🏁 All tests completed!
```

## Troubleshooting

### **If first execution fails:**
- Check if agents are properly configured
- Verify API keys are set
- Check browser console for agent errors

### **If learning doesn't happen:**
- Verify MCP is enabled (`mcpEnabled: true`)
- Check if `learnFromExecution()` is called
- Verify storage permissions

### **If similarity matching fails:**
- Check similarity threshold (default: 0.7)
- Verify task text is similar enough
- Check context matching (URL, page title, etc.)
