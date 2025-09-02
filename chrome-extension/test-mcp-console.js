// MCP System Console Test
// Run this in the browser console to test the MCP system

console.log('🧪 Testing MCP System...');

// Test 1: Get MCP Stats
async function testMCPStats() {
  try {
    console.log('📊 Testing MCP Stats...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_stats' });
    console.log('MCP Stats Response:', response);

    if (response && response.success) {
      console.log('✅ MCP Stats working!');
      console.log('Stats:', response.stats);
    } else {
      console.log('❌ MCP Stats failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ MCP Stats error:', error);
  }
}

// Test 2: Get All Actions
async function testGetActions() {
  try {
    console.log('📋 Testing Get Actions...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_get_actions' });
    console.log('Get Actions Response:', response);

    if (response && response.success) {
      console.log('✅ Get Actions working!');
      console.log('Actions count:', response.actions?.length || 0);
    } else {
      console.log('❌ Get Actions failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ Get Actions error:', error);
  }
}

// Test 3: Test MCP Consultation Request
async function testMCPConsultation() {
  try {
    console.log('🔍 Testing MCP Consultation...');
    const response = await chrome.runtime.sendMessage({
      type: 'mcp_consultation_request',
      task: 'Test consultation request',
      tabId: 1,
      taskId: 'test_' + Date.now(),
    });
    console.log('MCP Consultation Response:', response);

    if (response && response.success) {
      console.log('✅ MCP Consultation working!');
      console.log('Used learned actions:', response.usedLearnedActions);
    } else {
      console.log('❌ MCP Consultation failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ MCP Consultation error:', error);
  }
}

// Test 4: Clear All Actions
async function testClearActions() {
  try {
    console.log('🧹 Testing Clear Actions...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_clear_actions' });
    console.log('Clear Actions Response:', response);

    if (response && response.success) {
      console.log('✅ Clear Actions working!');
    } else {
      console.log('❌ Clear Actions failed:', response?.error);
    }
  } catch (error) {
    console.error('❌ Clear Actions error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all MCP tests...');

  await testMCPStats();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetActions();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testMCPConsultation();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testClearActions();

  console.log('🏁 All tests completed!');
}

// Export functions for manual testing
window.testMCP = {
  stats: testMCPStats,
  actions: testGetActions,
  consultation: testMCPConsultation,
  clear: testClearActions,
  all: runAllTests,
};

console.log('✅ MCP test functions loaded! Use window.testMCP.all() to run all tests');
console.log('Or run individual tests: window.testMCP.stats(), window.testMCP.actions(), etc.');
