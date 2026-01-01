import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  Plus, 
  Filter, 
  Search, 
  Folder, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Activity
} from 'lucide-react';

const Projects = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📋',
  });

  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/projects?${params.toString()}`);
      return response.data.projects;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => api.post('/projects', projectData),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowNewProject(false);
      setNewProject({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '📋',
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: <Activity size={14} /> },
      completed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={14} /> },
      archived: { color: 'bg-gray-100 text-gray-800', icon: <Archive size={14} /> },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: <Folder size={14} /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getCompletionPercentage = (project) => {
    if (!project.task_count || project.task_count === 0) return 0;
    return Math.round((project.completed_tasks / project.task_count) * 100);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    
    createProjectMutation.mutate(newProject);
  };

  const handleDeleteProject = (projectId, projectName) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This will also delete all tasks in this project.`)) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
  ];

  const iconOptions = [
    '📋', '📁', '🎯', '🚀', '💡', '📊',
    '💰', '👥', '🔧', '🎨', '📈', '📚',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Organize and manage your projects</p>
        </div>
        
        <button 
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {projects?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Folder className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to get started</p>
          <button 
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    >
                      {project.icon || '📋'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                )}
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{getCompletionPercentage(project)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionPercentage(project)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Project Footer */}
              <div className="p-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-gray-700">{project.completed_tasks || 0} done</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-gray-700">{project.task_count || 0} total</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {project.due_date && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={14} />
                        <span>{new Date(project.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">New Project</h3>
                <button 
                  onClick={() => setShowNewProject(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Website Redesign"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe your project..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${newProject.color === color.value ? 'border-gray-800' : 'border-transparent'}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewProject({ ...newProject, color: color.value })}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${newProject.icon === icon ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                          onClick={() => setNewProject({ ...newProject, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;