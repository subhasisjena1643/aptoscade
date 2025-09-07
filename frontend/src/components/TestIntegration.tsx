'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export function TestIntegration() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const health = await apiClient.healthCheck();
      setTestResult(`✅ Backend Connected! Status: ${health.status} at ${health.timestamp}`);
    } catch (error) {
      setTestResult(`❌ Backend Connection Failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    try {
      await register(
        `testuser_${Date.now()}`,
        `test_${Date.now()}@aptoscade.com`,
        'password123'
      );
      setTestResult('✅ Registration successful!');
    } catch (error) {
      setTestResult(`❌ Registration failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGameStats = async () => {
    setLoading(true);
    try {
      const stats = await apiClient.getSystemStatus();
      setTestResult(`✅ Game Stats: ${stats.totalPlayers} players, ${stats.activeGames} active games`);
    } catch (error) {
      setTestResult(`❌ Game stats failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-purple-900/20 rounded-lg border border-purple-500/30 mt-4">
      <h3 className="text-xl font-bold text-purple-300 mb-4">🧪 Integration Test Panel</h3>
      
      {/* User Status */}
      <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
        <p className="text-blue-300">
          User Status: {isAuthenticated ? `✅ Logged in as ${user?.username}` : '❌ Not logged in'}
        </p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50"
        >
          Test Backend
        </button>
        
        <button
          onClick={testRegistration}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
        >
          Test Registration
        </button>
        
        <button
          onClick={testGameStats}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50"
        >
          Test Game Stats
        </button>
      </div>

      {/* Logout Button */}
      {isAuthenticated && (
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors mr-3"
        >
          Logout
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <p className="text-yellow-300">🔄 Testing...</p>
      )}

      {/* Test Results */}
      {testResult && (
        <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600">
          <pre className="text-green-300 text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
}
