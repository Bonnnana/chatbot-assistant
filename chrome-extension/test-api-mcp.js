// Test script for API-based MCP System
console.log('🧪 Testing API-based MCP System...');

// Test 1: Clear all learned API actions
async function testClearApiActions() {
  try {
    console.log('🔍 Testing clear API actions...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_clear_actions' });
    console.log('Clear API actions response:', response);

    if (response && response.success) {
      console.log('✅ API actions cleared successfully!');
    } else {
      console.log('❌ Failed to clear API actions:', response?.error);
    }
  } catch (error) {
    console.error('❌ Clear API actions error:', error);
  }
}

// Test 2: Get all learned API actions
async function testGetApiActions() {
  try {
    console.log('🔍 Testing get API actions...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_get_actions' });
    console.log('Get API actions response:', response);

    if (response && response.success) {
      console.log('✅ Retrieved API actions successfully!');
      console.log('Number of API actions:', response.actions?.length || 0);
      if (response.actions && response.actions.length > 0) {
        console.log('Sample API action:', response.actions[0]);
      }
    } else {
      console.log('❌ Failed to get API actions:', response?.error);
    }
  } catch (error) {
    console.error('❌ Get API actions error:', error);
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

// Test 4: Test API Learning Stats
async function testApiLearningStats() {
  try {
    console.log('🔍 Testing API Learning Stats...');
    const response = await chrome.runtime.sendMessage({ type: 'mcp_stats' });
    console.log('API Learning Stats Response:', response);

    if (response && response.success) {
      console.log('✅ API Learning stats retrieved!');
      console.log('Stats:', response.stats);
    } else {
      console.log('❌ Failed to get API learning stats:', response?.error);
    }
  } catch (error) {
    console.error('❌ API Learning stats error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API-based MCP System Tests...\n');

  await testClearApiActions();
  console.log('');

  await testGetApiActions();
  console.log('');

  await testMCPConsultation();
  console.log('');

  await testApiLearningStats();
  console.log('');

  console.log('✅ All tests completed!');
}

// Export functions for manual testing
window.testApiMCP = {
  clearActions: testClearApiActions,
  getActions: testGetApiActions,
  testConsultation: testMCPConsultation,
  getStats: testApiLearningStats,
  runAll: runAllTests,
};

console.log('📝 Test functions available as window.testApiMCP');
console.log('Run: window.testApiMCP.runAll() to execute all tests');
