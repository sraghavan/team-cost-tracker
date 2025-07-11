import React, { useState } from 'react';
import { dbOperations } from '../lib/supabase';

const DatabaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [envVars, setEnvVars] = useState({});

  const checkEnvVars = () => {
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const vars = {
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
      url_length: process.env.REACT_APP_SUPABASE_URL?.length || 0,
      key_length: key?.length || 0,
      url_has_newlines: process.env.REACT_APP_SUPABASE_URL?.includes('\n') || false,
      key_has_newlines: key?.includes('\n') || false,
      key_first_20: key?.substring(0, 20) || 'Missing',
      key_last_20: key?.substring(key.length - 20) || 'Missing',
      key_has_dots: key?.split('.').length || 0,
      key_is_jwt: key?.startsWith('eyJ') || false,
    };
    setEnvVars(vars);
  };

  const testRawSupabase = async () => {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        return {
          test: 'Raw Supabase API Test',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}. Response: ${responseText}`
        };
      }
      
      return {
        test: 'Raw Supabase API Test',
        status: 'success',
        message: `Connected successfully. Response: ${responseText.substring(0, 100)}...`
      };
    } catch (error) {
      return {
        test: 'Raw Supabase API Test',
        status: 'error',
        message: `Connection failed: ${error.message}`
      };
    }
  };

  const testSupabaseHealth = async () => {
    const url = process.env.REACT_APP_SUPABASE_URL;
    
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await response.text();
      
      return {
        test: 'Supabase Health Check (no auth)',
        status: response.ok ? 'success' : 'error',
        message: `HTTP ${response.status}: ${responseText.substring(0, 200)}...`
      };
    } catch (error) {
      return {
        test: 'Supabase Health Check',
        status: 'error',
        message: `Connection failed: ${error.message}`
      };
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    const results = [];
    
    // Check environment variables first
    checkEnvVars();
    
    // Test Supabase health (no auth)
    const healthTest = await testSupabaseHealth();
    results.push(healthTest);
    
    // Test raw Supabase connection
    const rawTest = await testRawSupabase();
    results.push(rawTest);

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
      
      <button onClick={checkEnvVars} style={{ marginLeft: '10px' }}>
        Check Environment Variables
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
      
      {Object.keys(envVars).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Environment Variables:</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} style={{ margin: '5px 0' }}>
                <strong>{key}:</strong> {
                  key.includes('KEY') ? 
                    (value ? `[${value.length} chars] ${value.substring(0, 20)}...` : 'Missing') 
                    : String(value)
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseTest;