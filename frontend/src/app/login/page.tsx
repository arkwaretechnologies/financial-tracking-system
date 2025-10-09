'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';

type LoginStep = 'clientId' | 'userLogin';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('clientId');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleClientIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Basic validation
    if (!clientId || clientId.length < 3) {
      setError('Client ID must be at least 3 characters');
      setLoading(false);
      return;
    }

    try {
      // Validate client ID with server
      const response = await api.validateClient(clientId);
      
      if (response.valid && response.client) {
        setClientName(response.client.name);
        setStep('userLogin');
      } else {
        setError('Client not found');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message?.includes('not found')) {
          setError('Client not found');
        } else {
          setError(err.message || 'Failed to validate client');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(clientId, username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'clientId':
        return (
          <form onSubmit={handleClientIdSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Enter your client ID (e.g., CLIENT001)"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="pt-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Validating...' : 'Continue'}
              </Button>
            </CardFooter>
          </form>
        );

      case 'userLogin':
        return (
          <form onSubmit={handleUserLoginSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Client ID: {clientId}</p>
                {clientName && (
                  <p className="text-sm text-gray-500 font-medium">{clientName}</p>
                )}
                <button 
                  type="button"
                  onClick={() => setStep('clientId')}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  ← Change Client ID
                </button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username/Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Financial Tracking System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              {step === 'clientId' 
                ? 'Enter your client ID to continue' 
                : 'Enter your credentials to access the system'
              }
            </CardDescription>
          </CardHeader>
          
          {renderStep()}
        </Card>
      </div>
    </div>
  );
}