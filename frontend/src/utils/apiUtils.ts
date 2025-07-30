// Utility functions for API calls with proper error handling

export class ApiError extends Error {
  status: number;
  statusText: string;
  
  constructor(status: number, statusText: string, message?: string) {
    super(message || `HTTP error! status: ${status}`);
    this.status = status;
    this.statusText = statusText;
    this.name = 'ApiError';
  }
}

/**
 * Handles API response errors with proper messaging for different status codes
 */
export const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage: string;
  // Try to get error message from response body
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
  } catch {
    errorMessage = `HTTP error! status: ${response.status}`;
  }
    
  switch (response.status) {
    case 401:
      errorMessage = 'Permission denied. Please check your login credentials.';
      break;
    case 403:
      errorMessage = 'Access forbidden. You do not have permission to perform this action.';
      break;
    case 404:
      errorMessage = 'Resource not found.';
      break;
    case 500:
      errorMessage = `Internal server error. ${errorMessage}`;
      break;
  }
  
  throw new ApiError(response.status, response.statusText, errorMessage);
};

/**
 * Enhanced fetch function with proper error handling
 */
export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, {
      credentials: 'include', // Include credentials for session-based auth
      ...options,
    });
    
    if (!response.ok) {
      await handleApiError(response);
    }
    
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new Error('Network error. Please check your connection and try again.');
  }
};

/**
 * Utility for downloading files with proper error handling
 */
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await apiFetch(url);
    
    // Get the blob data
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Try to get filename from Content-Disposition header if not provided
    if (!filename) {
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
    }
    
    if (filename) {
      link.download = filename;
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Failed to download file. Please try again.');
  }
}; 