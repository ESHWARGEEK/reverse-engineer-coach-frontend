import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  Shield, 
  Mail, 
  Lock,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';

interface UserProfileProps {
  onClose?: () => void;
}

interface ProfileData {
  id: string;
  email: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  preferred_ai_provider: string;
  preferred_language: string;
  preferred_frameworks?: string[];
  learning_preferences?: Record<string, any>;
  has_github_token: boolean;
  has_ai_api_key: boolean;
  github_token_masked?: string;
  ai_api_key_masked?: string;
}

interface CredentialValidation {
  github_token_valid: boolean;
  ai_api_key_valid: boolean;
  validation_errors: Record<string, string>;
}

// Profile API functions
const profileAPI = {
  getProfile: async (): Promise<ProfileData> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  updateProfile: async (updates: {
    email?: string;
    preferred_ai_provider?: string;
    preferred_language?: string;
    preferred_frameworks?: string[];
    learning_preferences?: Record<string, any>;
  }): Promise<ProfileData> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    return response.json();
  },

  updatePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update password');
    }
  },

  updateCredentials: async (data: {
    github_token?: string;
    ai_api_key?: string;
    ai_provider?: string;
  }): Promise<CredentialValidation> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/credentials', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update credentials');
    }

    return response.json();
  },

  validateCredentials: async (): Promise<CredentialValidation> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/credentials/validate', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to validate credentials');
    }

    return response.json();
  },

  deleteCredentials: async (): Promise<void> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/profile/credentials', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete credentials');
    }
  },
};

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, logout, refreshUser } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'credentials' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    preferred_language: 'python',
    preferred_frameworks: [] as string[],
    preferred_ai_provider: 'openai' as 'openai' | 'gemini',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Credentials form state
  const [credentialsForm, setCredentialsForm] = useState({
    github_token: '',
    ai_api_key: '',
  });
  const [showCredentials, setShowCredentials] = useState({
    github: false,
    ai: false,
  });
  const [credentialValidation, setCredentialValidation] = useState<CredentialValidation | null>(null);

  // Load profile data
  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileAPI.getProfile();
      setProfileData(data);
      setProfileForm({
        email: data.email,
        preferred_language: data.preferred_language,
        preferred_frameworks: data.preferred_frameworks || [],
        preferred_ai_provider: data.preferred_ai_provider as 'openai' | 'gemini',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileAPI.updateProfile(profileForm);
      setProfileData(updatedProfile);
      await refreshUser();
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await profileAPI.updatePassword(passwordForm);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
      });
      setSuccessMessage('Password updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const validation = await profileAPI.updateCredentials({
        github_token: credentialsForm.github_token || undefined,
        ai_api_key: credentialsForm.ai_api_key || undefined,
        ai_provider: profileForm.preferred_ai_provider,
      });

      setCredentialValidation(validation);

      if (validation.github_token_valid && validation.ai_api_key_valid && 
          Object.keys(validation.validation_errors).length === 0) {
        setCredentialsForm({ github_token: '', ai_api_key: '' });
        await loadProfile();
        setSuccessMessage('Credentials updated successfully');
      } else {
        setError('Some credentials failed validation. Please check and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const validation = await profileAPI.validateCredentials();
      setCredentialValidation(validation);
      
      if (validation.github_token_valid && validation.ai_api_key_valid) {
        setSuccessMessage('All credentials are valid');
      } else {
        setError('Some credentials are invalid or expired');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!window.confirm('Are you sure you want to delete all stored API credentials? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await profileAPI.deleteCredentials();
      await loadProfile();
      setSuccessMessage('All credentials deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!profileData) return;

    const exportData = {
      profile: {
        email: profileData.email,
        preferred_language: profileData.preferred_language,
        preferred_ai_provider: profileData.preferred_ai_provider,
        preferred_frameworks: profileData.preferred_frameworks,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  if (isLoading && !profileData) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'credentials', label: 'API Keys', icon: Key },
    { id: 'data', label: 'Data', icon: Shield },
  ];

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Account Settings</h3>
            <p className="text-sm text-gray-400">{profileData.email}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-500 rounded-lg p-3 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-900/50 border border-green-500 rounded-lg p-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preferred Language
              </label>
              <select
                value={profileForm.preferred_language}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferred_language: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Provider
              </label>
              <select
                value={profileForm.preferred_ai_provider}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferred_ai_provider: e.target.value as 'openai' | 'gemini' }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              <p>Member since {new Date(profileData.created_at).toLocaleDateString()}</p>
              {profileData.last_login && (
                <p>Last login: {new Date(profileData.last_login).toLocaleDateString()}</p>
              )}
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Change Password</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={isLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_new_password}
                className="mt-4 flex items-center"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">API Credentials</h4>
              
              {/* Current Credentials Status */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h5 className="text-sm font-medium text-gray-300 mb-3">Current Status</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">GitHub Token:</span>
                    <div className="flex items-center space-x-2">
                      {profileData.has_github_token ? (
                        <>
                          <span className="text-sm text-green-400">Configured</span>
                          <span className="text-xs text-gray-500 font-mono">{profileData.github_token_masked}</span>
                        </>
                      ) : (
                        <span className="text-sm text-red-400">Not configured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">AI API Key:</span>
                    <div className="flex items-center space-x-2">
                      {profileData.has_ai_api_key ? (
                        <>
                          <span className="text-sm text-green-400">Configured</span>
                          <span className="text-xs text-gray-500 font-mono">{profileData.ai_api_key_masked}</span>
                        </>
                      ) : (
                        <span className="text-sm text-red-400">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleValidateCredentials}
                    disabled={isLoading}
                    variant="secondary"
                    size="sm"
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                  <Button
                    onClick={handleDeleteCredentials}
                    disabled={isLoading}
                    variant="secondary"
                    size="sm"
                    className="flex items-center text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </div>

              {/* Credential Validation Results */}
              {credentialValidation && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h5 className="text-sm font-medium text-gray-300 mb-3">Validation Results</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">GitHub Token:</span>
                      <div className="flex items-center">
                        {credentialValidation.github_token_valid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm ml-2 ${credentialValidation.github_token_valid ? 'text-green-400' : 'text-red-400'}`}>
                          {credentialValidation.github_token_valid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">AI API Key:</span>
                      <div className="flex items-center">
                        {credentialValidation.ai_api_key_valid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm ml-2 ${credentialValidation.ai_api_key_valid ? 'text-green-400' : 'text-red-400'}`}>
                          {credentialValidation.ai_api_key_valid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {Object.keys(credentialValidation.validation_errors).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <h6 className="text-xs font-medium text-red-400 mb-2">Errors:</h6>
                      {Object.entries(credentialValidation.validation_errors).map(([key, error]) => (
                        <p key={key} className="text-xs text-red-400">
                          {key}: {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Update Credentials Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Token
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials.github ? 'text' : 'password'}
                      value={credentialsForm.github_token}
                      onChange={(e) => setCredentialsForm(prev => ({ ...prev, github_token: e.target.value }))}
                      placeholder="Leave empty to keep current token"
                      className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(prev => ({ ...prev, github: !prev.github }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showCredentials.github ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AI API Key ({profileForm.preferred_ai_provider})
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials.ai ? 'text' : 'password'}
                      value={credentialsForm.ai_api_key}
                      onChange={(e) => setCredentialsForm(prev => ({ ...prev, ai_api_key: e.target.value }))}
                      placeholder="Leave empty to keep current key"
                      className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(prev => ({ ...prev, ai: !prev.ai }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showCredentials.ai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdateCredentials}
                disabled={isLoading || (!credentialsForm.github_token && !credentialsForm.ai_api_key)}
                className="mt-4 flex items-center"
              >
                <Key className="w-4 h-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Credentials'}
              </Button>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Data Management</h4>
              
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Export Data</h5>
                  <p className="text-sm text-gray-400 mb-4">
                    Download a copy of your profile data and preferences.
                  </p>
                  <Button
                    onClick={handleExportData}
                    variant="secondary"
                    size="sm"
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Profile Data
                  </Button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Account Deletion</h5>
                  <p className="text-sm text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
                        // Account deletion would be implemented here
                        alert('Account deletion feature coming soon');
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex items-center text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 border-t border-gray-700">
        <div className="text-sm text-gray-500">
          Last updated: {new Date(profileData.updated_at).toLocaleDateString()}
        </div>
        <div className="flex space-x-3">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};