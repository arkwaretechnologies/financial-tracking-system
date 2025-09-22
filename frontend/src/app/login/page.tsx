'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type LoginStep = 'clientId' | 'userLogin';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('clientId');
  const [clientId, setClientId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleClientIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate client ID exists
    const mockClients = {
      '12345': { name: 'Test Corporation' },
      'CLIENT001': { name: 'ABC Corporation' },
      'CLIENT002': { name: 'XYZ Industries' },
      'CLIENT003': { name: 'Demo Client' }
    };

    if (!mockClients[clientId as keyof typeof mockClients]) {
      setError('Invalid Client ID');
      return;
    }
    
    setStep('userLogin');
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
            
            <CardFooter>
              <Button type="submit" className="w-full">
                Continue
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
                <button 
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
                  type="email"
                  placeholder="Enter your email address"
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
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Demo Credentials for {clientId}:</p>
                {clientId === '12345' && (
                  <>
                    <p>• admin@testcorp.com / admin123 (Admin)</p>
                    <p>• john@testcorp.com / user123 (Store User)</p>
                    <p>• jane@testcorp.com / user123 (Store User)</p>
                  </>
                )}
                {clientId === 'CLIENT001' && (
                  <>
                    <p>• admin@abc.com / admin123 (Admin)</p>
                    <p>• mike@abc.com / user123 (Store User)</p>
                  </>
                )}
                {clientId === 'CLIENT002' && (
                  <>
                    <p>• admin@xyz.com / admin456 (Admin)</p>
                    <p>• sarah@xyz.com / user456 (Store User)</p>
                  </>
                )}
                {clientId === 'CLIENT003' && (
                  <>
                    <p>• demo@demo.com / demo123 (Admin)</p>
                    <p>• user@demo.com / demo123 (Store User)</p>
                  </>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === 'clientId' ? 'Client Login' : 'User Login'}
          </CardTitle>
          <CardDescription>
            {step === 'clientId' 
              ? 'Enter your client ID to continue' 
              : 'Enter your credentials to access the system'
            }
          </CardDescription>
        </CardHeader>
        
        {renderStep()}
        
        <div className="text-center p-4 border-t">
          <p className="text-xs text-gray-500 mb-2">
            Need super admin access?
          </p>
          <a 
            href="/admin/login" 
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Super Admin Login →
          </a>
        </div>
      </Card>
    </div>
  );
}