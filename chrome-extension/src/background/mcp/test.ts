import { MCPServer } from './server';
import { mcpStorage } from './storage';
import type { TaskContext, MCPRequest } from './types';

// Simple test function to verify MCP system
export async function testMCPSystem() {
  console.log('🧪 Testing MCP System...');

  try {
    // Test 1: Check if storage is working
    console.log('📦 Testing storage...');
    const initialStats = await MCPServer.getLearningStats();
    console.log('Initial stats:', initialStats);

    // Test 2: Create a mock task context
    const mockContext: TaskContext = {
      url: 'https://example.com',
      pageTitle: 'Example Page',
      elementCount: 10,
      timestamp: Date.now(),
    };

    // Test 3: Process a mock request
    console.log('🔄 Testing request processing...');
    const mockRequest: MCPRequest = {
      taskId: 'test-task-1',
      task: 'Click the login button',
      context: mockContext,
    };

    const response = await MCPServer.processRequest(mockRequest);
    console.log('MCP Response:', response);

    // Test 4: Check if actions are stored
    const actions = await MCPServer.getAllLearnedActions();
    console.log('Stored actions:', actions);

    console.log('✅ MCP System test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ MCP System test failed:', error);
    return false;
  }
}

// Test similarity matching
export async function testSimilarityMatching() {
  console.log('🔍 Testing similarity matching...');

  try {
    // Get all actions
    const actions = await MCPServer.getAllLearnedActions();

    if (actions.length === 0) {
      console.log('No actions to test similarity with');
      return;
    }

    // Test similarity with a similar task
    const similarTask = 'Click the login button';
    const similarContext: TaskContext = {
      url: 'https://example.com',
      pageTitle: 'Example Page',
      elementCount: 10,
      timestamp: Date.now(),
    };

    const response = await MCPServer.processRequest({
      taskId: 'test-similarity',
      task: similarTask,
      context: similarContext,
    });

    console.log('Similarity test response:', response);
  } catch (error) {
    console.error('Similarity test failed:', error);
  }
}
