import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Bell,
  User,
  Shield,
  Palette,
  Moon,
  Sun,
  Globe,
  Save,
  Mail,
  Smartphone,
  Volume2,
  Clock,
  Check,
  X,
  RefreshCw,
  LogOut
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout, updateProfile } = useAuth();
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    timezone: user?.timezone || 'UTC',
    avatar_url: user?.avatar_url || '',
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences');
      return response.data.preferences;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (updates) => api.put('/notifications/preferences', updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
    },
  });

  const sendTestNotificationMutation = useMutation({
    mutationFn: () => api.post('/notifications/test'),
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    await updateProfile(profileForm);
  };

  const handlePreferencesUpdate = (updates) => {
    updatePreferencesMutation.mutate(updates);
  };

  const handleNotificationToggle = (key, value) => {
    const updated = {
      ...preferences.notification_settings,
      [key]: value,
    };
    handlePreferencesUpdate({ notification_settings: updated });
  };

  const handleAIToggle = (key, value) => {
    const updated = {
      ...preferences.ai_preferences,
      [key]: value,
    };
    handlePreferencesUpdate({ ai_preferences: updated });
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'ai', label: 'AI Preferences', icon: <Smartphone size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-6">Manage your account and preferences</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
              
              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <Edit size={16} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Member since {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    value={user?.email}
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Contact support to change your email</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && preferences && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Notification Channels</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="text-gray-400" size={20} />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notification_settings.email}
                            onChange={(e) => handleNotificationToggle('email', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="text-gray-400" size={20} />
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notification_settings.push}
                            onChange={(e) => handleNotificationToggle('push', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="text-gray-400" size={20} />
                          <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Receive SMS for critical alerts</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notification_settings.sms}
                            onChange={(e) => handleNotificationToggle('sms', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Daily Digest</p>
                          <p className="text-sm text-gray-500">Receive daily summary email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notification_settings.dailyDigest}
                            onChange={(e) => handleNotificationToggle('dailyDigest', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Quiet Hours</p>
                          <p className="text-sm text-gray-500">Pause notifications during specific hours</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notification_settings.quietHours?.enabled}
                            onChange={(e) => {
                              const updated = {
                                ...preferences.notification_settings.quietHours,
                                enabled: e.target.checked,
                              };
                              handleNotificationToggle('quietHours', updated);
                            }}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      {preferences.notification_settings.quietHours?.enabled && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                              </label>
                              <input
                                type="time"
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                value={preferences.notification_settings.quietHours.start}
                                onChange={(e) => {
                                  const updated = {
                                    ...preferences.notification_settings.quietHours,
                                    start: e.target.value,
                                  };
                                  handleNotificationToggle('quietHours', updated);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                              </label>
                              <input
                                type="time"
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                value={preferences.notification_settings.quietHours.end}
                                onChange={(e) => {
                                  const updated = {
                                    ...preferences.notification_settings.quietHours,
                                    end: e.target.value,
                                  };
                                  handleNotificationToggle('quietHours', updated);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <button
                      onClick={() => sendTestNotificationMutation.mutate()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Bell size={18} />
                      Send Test Notification
                    </button>
                    
                    {sendTestNotificationMutation.isSuccess && (
                      <p className="mt-2 text-green-600 text-sm">Test notification sent!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && preferences && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">AI Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-extract Tasks</p>
                        <p className="text-sm text-gray-500">Automatically extract tasks from emails and meetings</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={preferences.ai_preferences.autoExtractTasks}
                          onChange={(e) => handleAIToggle('autoExtractTasks', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-schedule</p>
                        <p className="text-sm text-gray-500">Automatically schedule tasks based on priorities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={preferences.ai_preferences.autoSchedule}
                          onChange={(e) => handleAIToggle('autoSchedule', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Smart Prioritization</p>
                        <p className="text-sm text-gray-500">AI-powered task prioritization</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={preferences.ai_preferences.smartPrioritization}
                          onChange={(e) => handleAIToggle('smartPrioritization', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Language</h3>
                  <div className="flex items-center gap-3">
                    <Globe className="text-gray-400" size={20} />
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={preferences.ai_preferences.language}
                      onChange={(e) => handleAIToggle('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && preferences && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handlePreferencesUpdate({ theme: 'light' })}
                      className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center ${
                        preferences.theme === 'light'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="mb-2" size={24} />
                      <span className="font-medium">Light</span>
                    </button>
                    
                    <button
                      onClick={() => handlePreferencesUpdate({ theme: 'dark' })}
                      className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center ${
                        preferences.theme === 'dark'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="mb-2" size={24} />
                      <span className="font-medium">Dark</span>
                    </button>
                    
                    <button
                      onClick={() => handlePreferencesUpdate({ theme: 'auto' })}
                      className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center ${
                        preferences.theme === 'auto'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RefreshCw className="mb-2" size={24} />
                      <span className="font-medium">Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Account Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Change
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">Chrome on Windows • Just now</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Active
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Mobile Session</p>
                        <p className="text-sm text-gray-500">Safari on iPhone • 2 hours ago</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 text-red-600">Danger Zone</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;