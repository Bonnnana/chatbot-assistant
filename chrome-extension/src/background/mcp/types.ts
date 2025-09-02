export interface TaskContext {
  url: string;
  pageTitle: string;
  elementCount: number;
  timestamp: number;
}

export interface ApiCall {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  responseStatus?: number;
  responseData?: any;
  timestamp: number;
}

export interface LearnedApiAction {
  id: string;
  taskDescription: string;
  taskHash: string;
  apiCalls: ApiCall[];
  successRate: number;
  lastUsed: number;
  createdAt: number;
  executionTime: number;
  context: TaskContext;
}

export interface MCPRequest {
  taskId: string;
  task: string;
  context: TaskContext;
}

export interface MCPResponse {
  success: boolean;
  error?: string;
  isNewTask: boolean;
  learnedAction?: LearnedApiAction;
  apiCalls?: ApiCall[];
}

export interface ApiCallResult {
  success: boolean;
  response?: any;
  error?: string;
  apiCall: ApiCall;
}

export interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  timestamp: number;
}

export interface NetworkResponse {
  status: number;
  headers: Record<string, string>;
  data?: any;
  timestamp: number;
}
