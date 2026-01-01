import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Plus, Filter, Search, Check, Clock, AlertCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';

const Tasks = () => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project_id: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    due_date: '',
  });

  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data.tasks;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.projects;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => api.post('/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        due_date: '',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }) => api.put(`/tasks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    createTaskMutation.mutate(newTask);
  };

  const handleCompleteTask = (taskId) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { status: 'completed' }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <Check className="text-green-600" size={16} />;
      case 'in_progress': return <Clock className="text-yellow-600" size={16} />;
      case 'overdue': return <AlertCircle className="text-red-600" size={16} />;
      default: return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        
        <button 
          onClick={() => document.getElementById('new-task-modal').showModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.project_id}
              onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
            >
              <option value="">All Projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : tasks?.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Check className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">Create your first task to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks?.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <Check className="text-white" size={14} />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-medium ${
                          task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.project_name && (
                          <span className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: task.project_color || '#6B7280' }}
                            ></div>
                            {task.project_name}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(task.due_date)}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <dialog id="new-task-modal" className="rounded-xl shadow-2xl backdrop:bg-black/50">
        <div className="w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
            <button 
              onClick={() => document.getElementById('new-task-modal').close()}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  >
                    <option value="">No project</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => document.getElementById('new-task-modal').close()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default Tasks;