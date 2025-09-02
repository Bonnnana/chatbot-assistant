# MCP (Model Context Protocol) Server Implementation

## Overview

The MCP server is an intelligent learning system that learns from executed actions by the planner, navigator, and validator agents. It stores these learned actions and serves them for subsequent similar requests, improving efficiency and reducing redundant processing.

## How It Works

### 1. First Request (Learning Phase)
- When a user makes a request, the system executes normally using the three agents:
  - **Planner**: Creates execution plan
  - **Navigator**: Executes actions
  - **Validator**: Validates results
- After execution, the MCP system learns from the agent history and stores the action patterns

### 2. Subsequent Similar Requests (Serving Phase)
- When a similar request comes in, the MCP server:
  - Analyzes the request using similarity matching
  - Finds the best matching learned action
  - Executes the learned actions directly without going through the agent pipeline
  - Updates success rates based on execution results

## Architecture

### Core Components

#### 1. **MCPServer** (`server.ts`)
- Main orchestrator for the MCP system
- Handles request processing, learning, and action serving
- Coordinates between storage, similarity matching, and action learning

#### 2. **ActionLearner** (`action-learner.ts`)
- Extracts action patterns from agent execution history
- Converts agent results to MCP action format
- Generates unique identifiers for learned actions

#### 3. **SimilarityMatcher** (`similarity.ts`)
- Calculates similarity between new requests and learned actions
- Uses multiple factors: task text, URL, page title, element count, time
- Provides confidence scores for matches

#### 4. **MCPServerStorage** (`storage.ts`)
- Persistent storage for learned actions
- Manages learning metrics and statistics
- Handles CRUD operations for learned actions

### Data Flow

```
User Request → MCP Check → Similarity Matching → Action Serving/Learning
     ↓              ↓              ↓                    ↓
Normal Execution  Learned Actions  Confidence Score  Store/Execute
```

## Key Features

### 1. **Intelligent Learning**
- Automatically extracts action patterns from successful executions
- Stores context information (URL, page title, element count)
- Tracks success rates and usage patterns

### 2. **Smart Similarity Matching**
- Text-based similarity using word overlap
- Context similarity (domain, page structure, timing)
- Confidence scoring based on multiple factors

### 3. **Performance Optimization**
- Skips agent pipeline for repeated tasks
- Reduces execution time for similar requests
- Maintains quality through success rate tracking

### 4. **Persistent Storage**
- Local storage for learned actions
- Automatic metrics calculation
- Easy management and cleanup

## Usage

### Integration with Executor

The MCP system is integrated into the main executor:

```typescript
// Check MCP before normal execution
if (this.mcpEnabled) {
  const mcpResult = await this.checkMCPForLearnedActions();
  if (mcpResult && !mcpResult.isNewTask) {
    await this.executeLearnedActions(mcpResult);
    return;
  }
}

// Normal execution if no learned actions found
// ... planner, navigator, validator execution
```

### Message Handling

The background script handles MCP-related messages:

- `mcp_stats`: Get learning statistics
- `mcp_clear_actions`: Clear all learned actions
- `mcp_get_actions`: Get all learned actions
- `mcp_delete_action`: Delete a specific action

## Configuration

### MCP Settings

```typescript
export class Executor {
  private mcpEnabled: boolean = true; // Enable/disable MCP
  // ... other properties
}
```

### Similarity Thresholds

```typescript
export class SimilarityMatcher {
  private static readonly SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score
  private static readonly MAX_MATCHES = 5; // Maximum matches to return
}
```

## Benefits

1. **Efficiency**: Reduces redundant processing for similar tasks
2. **Learning**: Continuously improves from successful executions
3. **Performance**: Faster execution for repeated tasks
4. **Intelligence**: Adapts to user behavior patterns
5. **Scalability**: Handles multiple learned action patterns

## Future Enhancements

1. **Advanced NLP**: Better text similarity using embeddings
2. **Context Awareness**: More sophisticated context matching
3. **Action Validation**: Verify learned actions still work
4. **User Feedback**: Allow users to rate learned actions
5. **Cloud Sync**: Share learned actions across devices

## Testing

Use the test functions to verify the system:

```typescript
import { testMCPSystem, testSimilarityMatching } from './mcp/test';

// Test basic functionality
await testMCPSystem();

// Test similarity matching
await testSimilarityMatching();
```

## Troubleshooting

### Common Issues

1. **Actions not learning**: Check if MCP is enabled and storage is working
2. **Poor similarity matching**: Adjust similarity thresholds
3. **Storage errors**: Verify local storage permissions

### Debug Mode

Enable debug logging to see detailed MCP operations:

```typescript
const logger = createLogger('MCPServer');
logger.debug('Processing MCP request:', request);
```
