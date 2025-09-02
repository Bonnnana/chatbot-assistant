import type { LearnedApiAction, ApiCall, TaskContext, NetworkRequest, NetworkResponse } from './types';
import { mcpStorage } from './storage';
import { createLogger } from '../log';

const logger = createLogger('ApiLearner');

export class ApiLearner {
  private static networkRequests: Map<string, NetworkRequest[]> = new Map();
  private static networkResponses: Map<string, NetworkResponse[]> = new Map();

  /**
   * Start monitoring network requests for a task
   */
  static startMonitoring(taskId: string): void {
    this.networkRequests.set(taskId, []);
    this.networkResponses.set(taskId, []);
  }

  /**
   * Stop monitoring network requests for a task
   */
  static stopMonitoring(taskId: string): void {
    logger.info(`Stopping network monitoring for task: ${taskId}`);
    this.networkRequests.delete(taskId);
    this.networkResponses.delete(taskId);
  }

  /**
   * Record a network request
   */
  static recordRequest(taskId: string, request: NetworkRequest): void {
    const requests = this.networkRequests.get(taskId);
    if (requests) {
      requests.push(request);
    }
  }

  /**
   * Record a network response
   */
  static recordResponse(taskId: string, response: NetworkResponse): void {
    const responses = this.networkResponses.get(taskId);
    if (responses) {
      responses.push(response);
      logger.debug(`Recorded response for task ${taskId}: ${response.status}`);
    }
  }

  /**
   * Learn API calls from network monitoring
   */
  static async learnFromNetworkMonitoring(
    taskId: string,
    task: string,
    context: TaskContext,
    executionTime: number,
  ): Promise<LearnedApiAction> {
    logger.info(`Learning API calls from network monitoring for task: ${task}`);

    const requests = this.networkRequests.get(taskId) || [];
    const responses = this.networkResponses.get(taskId) || [];

    console.log(`[ApiLearner] Total requests captured: ${requests.length}`);
    console.log(`[ApiLearner] Total responses captured: ${responses.length}`);

    // Convert network requests to API calls
    const apiCalls: ApiCall[] = requests.map((request, index) => {
      const response = responses[index];

      const apiCall = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        queryParams: request.queryParams,
        responseStatus: response?.status,
        responseData: response?.data,
        timestamp: request.timestamp,
      };

      console.log(`[ApiLearner] 📝 Captured API call ${index + 1}:`, apiCall);
      return apiCall;
    });

    // Filter out irrelevant API calls (static resources, analytics, etc.)
    const relevantApiCalls = this.filterRelevantApiCalls(apiCalls);
    console.log(`[ApiLearner] ✅ Relevant API calls after filtering: ${relevantApiCalls.length}`);

    // Create learned API action
    const learnedAction: LearnedApiAction = {
      id: this.generateActionId(task, context),
      taskDescription: task,
      taskHash: this.generateTaskHash(task),
      apiCalls: relevantApiCalls,
      successRate: 1.0, // Initial success rate
      lastUsed: Date.now(),
      createdAt: Date.now(),
      executionTime,
      context,
    };

    // Only store if we actually learned API calls
    if (relevantApiCalls.length > 0) {
      await mcpStorage.storeLearnedApiAction(learnedAction);
      logger.info(`Learned ${relevantApiCalls.length} API calls for task: ${task}`);
    } else {
      logger.info(`No relevant API calls found for task: ${task}, not storing action`);
    }

    return learnedAction;
  }

  /**
   * Filter out irrelevant API calls
   */
  private static filterRelevantApiCalls(apiCalls: ApiCall[]): ApiCall[] {
    return apiCalls.filter(call => {
      const url = call.url.toLowerCase();

      // Skip static resources
      if (url.includes('.css') || url.includes('.js') || url.includes('.png') || url.includes('.jpg')) {
        return false;
      }

      // Skip analytics and tracking
      if (url.includes('analytics') || url.includes('tracking') || url.includes('pixel')) {
        return false;
      }

      // Skip common CDN and third-party resources
      if (url.includes('cdn') || url.includes('googleapis') || url.includes('gstatic')) {
        return false;
      }

      // Keep API calls, form submissions, and AJAX requests
      return true;
    });
  }

  /**
   * Execute learned API calls
   */
  static async executeLearnedApiCalls(learnedAction: LearnedApiAction, currentTask?: string): Promise<any[]> {
    logger.info(`Executing ${learnedAction.apiCalls.length} learned API calls for: ${learnedAction.taskDescription}`);

    const results = [];
    let csrfToken: string | null = null;
    let targetProfessorId: string | null = null;

    // Extract target professor from the current task (user input)
    if (currentTask) {
      console.log(`[ApiLearner] 🔍 Current task: "${currentTask}"`);

      // Extract the full professor name from the task - handle multiple formats
      let professorMatch = currentTask.match(/Prof\.\s+([^,\s]+(?:\s+[^,\s]+)*)/);
      if (!professorMatch) {
        // Try alternative patterns
        professorMatch = currentTask.match(/Professor\s+([^,\s]+(?:\s+[^,\s]+)*)/);
      }
      if (!professorMatch) {
        // Try just looking for names after "with"
        professorMatch = currentTask.match(/with\s+([^,\s]+(?:\s+[^,\s]+)*)/);
      }

      if (professorMatch) {
        const fullProfessorName = professorMatch[1].trim();
        console.log(`[ApiLearner] 🎯 Extracted professor name from current task: ${fullProfessorName}`);

        // Convert full name to ID format (firstname.lastname)
        // Split by spaces and take first and last parts
        const nameParts = fullProfessorName.split(/\s+/);
        if (nameParts.length >= 2) {
          const firstName = nameParts[0].toLowerCase();
          const lastName = nameParts[nameParts.length - 1].toLowerCase();
          targetProfessorId = `${firstName}.${lastName}`;
          console.log(`[ApiLearner] 🎯 Target professor: ${fullProfessorName} -> ${targetProfessorId}`);
        } else if (nameParts.length === 1) {
          // If only one name part, use it as both first and last name
          const name = nameParts[0].toLowerCase();
          targetProfessorId = `${name}.${name}`;
          console.log(`[ApiLearner] 🎯 Target professor: ${fullProfessorName} -> ${targetProfessorId}`);
        } else {
          console.log(`[ApiLearner] ⚠️ Could not parse professor name: ${fullProfessorName}`);
        }
      } else {
        console.log(`[ApiLearner] ⚠️ Could not extract professor name from task: "${currentTask}"`);
      }
    }

    for (const apiCall of learnedAction.apiCalls) {
      try {
        // If this is a POST request with CSRF token, get a fresh token first
        if (apiCall.method === 'POST' && apiCall.body && apiCall.body.includes('_csrf=')) {
          console.log(`[ApiLearner] 🔄 Getting fresh CSRF token for POST request`);

          // Use target professor ID if available, otherwise extract from request body
          let professorId = targetProfessorId;
          if (!professorId) {
            const professorMatch = apiCall.body.match(/professorId=([^&]+)/);
            if (!professorMatch) {
              console.log(`[ApiLearner] ❌ Could not extract professor ID from request body`);
              results.push({
                success: false,
                error: 'Could not extract professor ID',
                apiCall,
              });
              continue;
            }
            professorId = professorMatch[1];
          }

          console.log(`[ApiLearner] 🔍 Using professor ID: ${professorId}`);

          // Get fresh CSRF token from the correct professor page
          const professorPageUrl = `https://consultations.finki.ukim.mk/consultations/student/professor/${professorId}`;
          console.log(`[ApiLearner] 🔄 Getting CSRF token from: ${professorPageUrl}`);

          const pageResponse = await fetch(professorPageUrl);
          const pageHtml = await pageResponse.text();

          // Extract CSRF token from the page
          const csrfMatch = pageHtml.match(/name="_csrf" value="([^"]+)"/);
          if (csrfMatch) {
            csrfToken = csrfMatch[1];
            console.log(`[ApiLearner] ✅ Got fresh CSRF token: ${csrfToken}`);

            // Update the request body with fresh CSRF token and correct professor ID
            let updatedBody = apiCall.body.replace(/_csrf=[^&]+/, `_csrf=${csrfToken}`);
            if (targetProfessorId) {
              updatedBody = updatedBody.replace(/professorId=[^&]+/, `professorId=${targetProfessorId}`);
            }
            const updatedApiCall = { ...apiCall, body: updatedBody };

            const result = await this.executeApiCall(updatedApiCall);
            results.push(result);
          } else {
            console.log(`[ApiLearner] ❌ Could not extract CSRF token from page`);
            results.push({
              success: false,
              error: 'Could not extract CSRF token',
              apiCall,
            });
          }
        } else {
          // For GET requests, update the URL if we have a target professor
          let updatedApiCall = apiCall;
          if (targetProfessorId && apiCall.url.includes('/professor/')) {
            const originalUrl = apiCall.url;
            const updatedUrl = originalUrl.replace(/\/professor\/[^\/]+/, `/professor/${targetProfessorId}`);
            console.log(`[ApiLearner] 🔄 Updating URL: ${originalUrl} -> ${updatedUrl}`);
            updatedApiCall = { ...apiCall, url: updatedUrl };
          } else {
            console.log(
              `[ApiLearner] 🔍 No URL update needed - targetProfessorId: ${targetProfessorId}, url: ${apiCall.url}`,
            );
          }

          const result = await this.executeApiCall(updatedApiCall);
          results.push(result);
        }

        // Add small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error executing API call ${apiCall.method} ${apiCall.url}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          apiCall,
        });
      }
    }

    return results;
  }

  /**
   * Execute a single API call
   */
  private static async executeApiCall(apiCall: ApiCall): Promise<any> {
    const { method, url, headers, body, queryParams } = apiCall;

    console.log(`[ApiLearner] 🔄 Executing API call: ${method} ${url}`);
    console.log(`[ApiLearner] 📋 Headers:`, headers);
    console.log(`[ApiLearner] 📦 Body:`, body);
    console.log(`[ApiLearner] 🔗 Query params:`, queryParams);

    // Build URL with query parameters
    let fullUrl = url;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const urlObj = new URL(url);
      Object.entries(queryParams).forEach(([key, value]) => {
        // Clear existing parameter to avoid duplicates
        urlObj.searchParams.delete(key);
        urlObj.searchParams.append(key, value);
      });
      fullUrl = urlObj.toString();
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
      },
    };

    if (body) {
      // Don't override Content-Type if it's already set in headers
      if (!headers['content-type'] && !headers['Content-Type']) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      }
      fetchOptions.body = body; // Keep body as string for form data
    }

    console.log(`[ApiLearner] 🚀 Making request to: ${fullUrl}`);
    console.log(`[ApiLearner] 📤 Request options:`, fetchOptions);

    try {
      // Execute the API call with authentication cookies
      const response = await this.executeApiCallWithCookies(fullUrl, fetchOptions);

      console.log(`[ApiLearner] 📥 Response status: ${response.status}`);
      console.log(`[ApiLearner] 📥 Response data:`, response.data);

      return {
        success: response.ok,
        response: response.data,
        status: response.status,
        apiCall,
      };
    } catch (error) {
      console.log(`[ApiLearner] ❌ Error executing API call:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiCall,
      };
    }
  }

  /**
   * Execute API call with authentication cookies
   */
  private static async executeApiCallWithCookies(url: string, options: RequestInit): Promise<any> {
    try {
      // Find the tab with the consultations website
      const tabs = await chrome.tabs.query({
        url: '*://consultations.finki.ukim.mk/*',
        active: true,
        currentWindow: true,
      });

      if (tabs.length === 0) {
        // If no active consultations tab, try to find any consultations tab
        const allConsultationsTabs = await chrome.tabs.query({
          url: '*://consultations.finki.ukim.mk/*',
        });

        if (allConsultationsTabs.length === 0) {
          // No consultations tab found, create a new one
          console.log(`[ApiLearner] 🌐 No consultations tab found, creating new tab...`);

          const newTab = await chrome.tabs.create({
            url: 'https://consultations.finki.ukim.mk/',
            active: true,
          });

          if (!newTab.id) {
            throw new Error('Failed to create new consultations tab');
          }

          console.log(`[ApiLearner] ✅ Created new consultations tab: ${newTab.id}`);

          // Wait a bit for the page to load
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Use the new tab
          const consultationsTab = newTab;
          console.log(
            `[ApiLearner] 🚀 Making authenticated request to: ${url} via new consultations tab ${consultationsTab.id}`,
          );

          // Execute the API call in the context of the consultations tab (with authentication)
          const result = await chrome.scripting.executeScript({
            target: { tabId: consultationsTab.id },
            func: async (apiUrl: string, apiOptions: RequestInit) => {
              try {
                console.log(`[ApiLearner] 🔄 Executing API call in tab context: ${apiUrl}`);

                const response = await fetch(apiUrl, apiOptions);
                let data = null;
                try {
                  data = await response.json();
                } catch (e) {
                  // Response might not be JSON
                  data = await response.text();
                }

                console.log(`[ApiLearner] 📥 Response status: ${response.status}`);
                console.log(`[ApiLearner] 📥 Response data:`, data);

                return {
                  ok: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  data: data,
                  headers: Object.fromEntries(response.headers.entries()),
                };
              } catch (error) {
                console.log(`[ApiLearner] ❌ Error in tab context:`, error);
                return {
                  ok: false,
                  status: 0,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            },
            args: [url, options],
          });

          if (result.length === 0 || !result[0].result) {
            throw new Error('Failed to execute API call in browser context');
          }

          return result[0].result;
        }

        // Use the first consultations tab found
        const consultationsTab = allConsultationsTabs[0];
        if (!consultationsTab.id) {
          throw new Error('Consultations tab has no ID');
        }

        console.log(
          `[ApiLearner] 🚀 Making authenticated request to: ${url} via existing consultations tab ${consultationsTab.id}`,
        );

        // Execute the API call in the context of the consultations tab (with authentication)
        const result = await chrome.scripting.executeScript({
          target: { tabId: consultationsTab.id },
          func: async (apiUrl: string, apiOptions: RequestInit) => {
            try {
              console.log(`[ApiLearner] 🔄 Executing API call in tab context: ${apiUrl}`);

              const response = await fetch(apiUrl, apiOptions);
              let data = null;
              try {
                data = await response.json();
              } catch (e) {
                // Response might not be JSON
                data = await response.text();
              }

              console.log(`[ApiLearner] 📥 Response status: ${response.status}`);
              console.log(`[ApiLearner] 📥 Response data:`, data);

              return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: data,
                headers: Object.fromEntries(response.headers.entries()),
              };
            } catch (error) {
              console.log(`[ApiLearner] ❌ Error in tab context:`, error);
              return {
                ok: false,
                status: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          },
          args: [url, options],
        });

        if (result.length === 0 || !result[0].result) {
          throw new Error('Failed to execute API call in browser context');
        }

        return result[0].result;
      }

      const activeTab = tabs[0];
      if (!activeTab.id) {
        throw new Error('Active tab has no ID');
      }

      console.log(`[ApiLearner] 🚀 Making authenticated request to: ${url} via tab ${activeTab.id}`);

      // Execute the API call in the context of the active tab (with authentication)
      const result = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: async (apiUrl: string, apiOptions: RequestInit) => {
          try {
            console.log(`[ApiLearner] 🔄 Executing API call in tab context: ${apiUrl}`);

            const response = await fetch(apiUrl, apiOptions);
            let data = null;
            try {
              data = await response.json();
            } catch (e) {
              // Response might not be JSON
              data = await response.text();
            }

            console.log(`[ApiLearner] 📥 Response status: ${response.status}`);
            console.log(`[ApiLearner] 📥 Response data:`, data);

            return {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              data: data,
              headers: Object.fromEntries(response.headers.entries()),
            };
          } catch (error) {
            console.log(`[ApiLearner] ❌ Error in tab context:`, error);
            return {
              ok: false,
              status: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
        args: [url, options],
      });

      if (result.length === 0 || !result[0].result) {
        throw new Error('Failed to execute API call in browser context');
      }

      return result[0].result;
    } catch (error) {
      console.log(`[ApiLearner] ❌ Error executing API call with cookies:`, error);
      throw error;
    }
  }

  /**
   * Generate unique action ID
   */
  private static generateActionId(task: string, context: TaskContext): string {
    const taskHash = this.generateTaskHash(task);
    const contextHash = this.generateContextHash(context);
    return `api_action_${taskHash}_${contextHash}_${Date.now()}`;
  }

  /**
   * Generate task hash for similarity matching
   */
  private static generateTaskHash(task: string): string {
    let hash = 0;
    for (let i = 0; i < task.length; i++) {
      const char = task.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate context hash
   */
  private static generateContextHash(context: TaskContext): string {
    const contextString = `${context.url}_${context.pageTitle}_${context.elementCount}`;
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update success rate for a learned action
   */
  static async updateSuccessRate(actionId: string, success: boolean): Promise<void> {
    await mcpStorage.updateApiActionSuccessRate(actionId, success);
  }

  /**
   * Get learning statistics
   */
  static async getLearningStats() {
    return await mcpStorage.getApiLearningMetrics();
  }
}
