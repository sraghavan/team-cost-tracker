import React, { useState } from 'react';
import { dbOperations } from '../lib/supabase';

const DatabaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results = [];

    // Test 1: Get app settings
    try {
      const settings = await dbOperations.getAppSettings();
      results.push({
        test: 'Get App Settings',
        status: 'success',
        message: settings ? `Found settings: ${JSON.stringify(settings)}` : 'No settings found'
      });
    } catch (error) {
      results.push({
        test: 'Get App Settings',
        status: 'error',
        message: error.message
      });
    }

    // Test 2: Save app settings
    try {
      const result = await dbOperations.saveAppSettings({ password: 'test123' });
      results.push({
        test: 'Save App Settings',
        status: 'success',
        message: `Saved: ${JSON.stringify(result)}`
      });
    } catch (error) {
      results.push({
        test: 'Save App Settings',
        status: 'error',
        message: error.message
      });
    }

    // Test 3: Get players (existing test)
    try {
      const players = await dbOperations.getPlayers();
      results.push({
        test: 'Get Players',
        status: 'success',
        message: `Found ${players.length} players`
      });
    } catch (error) {
      results.push({
        test: 'Get Players',
        status: 'error',
        message: error.message
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Database Connection Test</h2>
      <button onClick={runTests} disabled={isLoading}>
        {isLoading ? 'Running Tests...' : 'Run Database Tests'}
      </button>
      
      {testResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px'
            }}>
              <strong>{result.test}:</strong> 
              <span style={{ color: result.status === 'success' ? '#155724' : '#721c24' }}>
                {result.status === 'success' ? ' ✅' : ' ❌'}
              </span>
              <br />
              <small>{result.message}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseTest;