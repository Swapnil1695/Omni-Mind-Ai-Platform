import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
          
        case 403:
          console.error('Access forbidden:', data.error);
          break;
          
        case 404:
          console.error('Resource not found:', error.config.url);
          break;
          
        case 429:
          console.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          console.error('Server error. Please try again later.');
          break;
          
        default:
          console.error('API error:', data.error);
      }
      
      // Return error for component handling
      return Promise.reject({
        message: data.error || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Network error. Please check your connection.');
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message,
      });
    }
  }
);

// Helper functions for common operations
export const apiHelper = {
  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
  
  // Projects
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, updates) => api.put(`/projects/${id}`, updates),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Tasks
  getTasks: (params) => api.get('/tasks', { params }),
  getUpcomingTasks: (params) => api.get('/tasks/upcoming', { params }),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, updates) => api.put(`/tasks/${id}`, updates),
  completeTask: (id) => api.patch(`/tasks/${id}/complete`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Notifications
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotificationPreferences: () => api.get('/notifications/preferences'),
  updateNotificationPreferences: (updates) => api.put('/notifications/preferences', updates),
  markNotificationAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearAllNotifications: () => api.delete('/notifications/clear-all'),
  sendTestNotification: () => api.post('/notifications/test'),
  
  // AI
  extractTasks: (text, context) => api.post('/ai/extract-tasks', { text, context }),
  summarizeMeeting: (transcript, duration, participants) => 
    api.post('/ai/summarize-meeting', { transcript, duration, participants }),
  optimizeSchedule: (tasks, constraints) => 
    api.post('/ai/optimize-schedule', { tasks, constraints }),
  analyzeProductivity: (userId, days) => 
    api.post('/ai/analyze-productivity', { userId, days }),
  
  // File upload helper
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Websocket connection
  connectWebSocket: () => {
    const token = localStorage.getItem('token');
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    return new WebSocket(`${wsUrl}?token=${token}`);
  },
};

export default api;