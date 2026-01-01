import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.projects;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks?limit=10&sort=due_date&order=asc');
      return response.data.tasks;
    },
  });

  const { data: upcomingTasks } = useQuery({
    queryKey: ['upcomingTasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/upcoming?days=3');
      return response.data.tasks;
    },
  });

  useEffect(() => {
    if (tasks) {
      const completed = tasks.filter(t => t.status === 'completed').length;
      const pending = tasks.filter(t => t.status !== 'completed').length;
      const overdue = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      ).length;

      setStats({
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
      });
    }
  }, [tasks]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp size={16} className="mr-1" />
              <span>{((stats.completedTasks / stats.totalTasks) * 100 || 0).toFixed(1)}% completion rate</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdueTasks}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {tasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.project_name && (
                        <p className="text-sm text-gray-500">{task.project_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-sm text-gray-500">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Calendar size={16} />
                View calendar
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {upcomingTasks?.map((task) => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{task.project_name || 'No project'}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(task.due_date).toLocaleDateString()} at {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Plus className="text-gray-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">New Task</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Plus className="text-gray-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">New Project</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Calendar className="text-gray-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">Schedule Meeting</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Filter className="text-gray-400 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">Filter Tasks</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;