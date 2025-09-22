'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type LoginStep = 'clientId' | 'roleSelection' | 'rolePassword';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('clientId');
  const [clientId, setClientId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'client_user'>('admin');
  const [rolePassword, setRolePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleClientIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate client ID exists
    const mockClients = {
      'CLIENT001': { name: 'ABC Corporation', adminPassword: 'admin123', userPassword: 'user123' },
      'CLIENT002': { name: 'XYZ Industries', adminPassword: 'admin456', userPassword: 'user456' },
      'CLIENT003': { name: 'Demo Client', adminPassword: 'demo123', userPassword: 'demo123' }
    };

    if (!mockClients[clientId as keyof typeof mockClients]) {
      setError('Invalid Client ID');
      return;
    }
    
    setStep('roleSelection');
  };

  const handleRoleSelection = (role: 'admin' | 'client_user') => {
    setSelectedRole(role);
    setStep('rolePassword');
  };

  const handleRolePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(clientId, selectedRole, rolePassword);
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

      case 'roleSelection':
        return (
          <>
            <CardContent className="space-y-4">
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
                <Label>Select Your Role</Label>
                <RadioGroup value={selectedRole} onValueChange={(value) => handleRoleSelection(value as 'admin' | 'client_user')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="cursor-pointer flex-1">
                      <div className="font-medium">Admin</div>
                      <div className="text-sm text-gray-500">Full access to manage stores, users, and all transactions</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="client_user" id="client_user" />
                    <Label htmlFor="client_user" className="cursor-pointer flex-1">
                      <div className="font-medium">User</div>
                      <div className="text-sm text-gray-500">Access to record transactions and view reports</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </>
        );

      case 'rolePassword':
        return (
          <form onSubmit={handleRolePasswordSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Client ID: {clientId}</p>
                <p className="text-sm text-gray-600">Role: {selectedRole === 'admin' ? 'Admin' : 'User'}</p>
                <button 
                  onClick={() => setStep('roleSelection')}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  ← Change Role
                </button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rolePassword">Role Password</Label>
                <Input
                  id="rolePassword"
                  type="password"
                  placeholder={`Enter ${selectedRole} password`}
                  value={rolePassword}
                  onChange={(e) => setRolePassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Demo Credentials:</p>
                <p>• Admin password: admin123 (for CLIENT001)</p>
                <p>• User password: user123 (for CLIENT001)</p>
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Financial Tracking System</h1>
          <p className="mt-2 text-gray-600">Client Portal</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'clientId' && 'Client Login'}
              {step === 'roleSelection' && 'Select Role'}
              {step === 'rolePassword' && 'Enter Password'}
            </CardTitle>
            <CardDescription>
              {step === 'clientId' && 'Enter your Client ID to access the system'}
              {step === 'roleSelection' && 'Choose your access level'}
              {step === 'rolePassword' && `Enter your ${selectedRole} password`}
            </CardDescription>
          </CardHeader>
          
          {renderStep()}
        </Card>
        
        <div className="text-center">
          <a href="/admin/login" className="text-blue-600 hover:text-blue-800 text-sm">
            Super Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}