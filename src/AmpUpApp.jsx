import React, { useState } from 'react';
import { AlertCircle, Zap, Loader2 } from 'lucide-react';

export default function AmpUpApp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [placeId, setPlaceId] = useState('');
  const [placeData, setPlaceData] = useState(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.status === 'FAIL') {
        console.log('Login failed - status is FAIL');
        setError(data.message || data.reason || 'Invalid credentials. Please try again.');
      } else {
        console.log('Login successful');
        const token = data.data?.access_token || data.data?.token || data.token || data.access_token || data.auth_token || '';
        console.log('Auth Token Set:', token.substring(0, 40) + '...');
        setAuthToken(token);
        setUserData(data);
        setIsLoggedIn(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to AmpUp API. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && username && password && !isLoading) {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken('');
    setUserData(null);
    setUsername('');
    setPassword('');
    setError('');
    setPlaceId('');
    setPlaceData(null);
    setPlaceError('');
  };

  const handleLookupPlace = async () => {
    if (!placeId) {
      setPlaceError('Please enter a place ID');
      return;
    }

    if (!authToken) {
      setPlaceError('Authorization token is missing. Please log in again.');
      return;
    }

    setPlaceError('');
    setIsLoadingPlace(true);

    try {
      const response = await fetch(`/api/ampup/places/${placeId}?is_public=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      console.log('Place data:', data);

      if (data.status === 'FAIL' || data.error) {
        setPlaceError(data.message || data.reason || 'Failed to fetch place information');
        setPlaceData(null);
      } else {
        setPlaceData(data);
        setPlaceError('');
      }
    } catch (err) {
      console.error('Place lookup error:', err);
      setPlaceError('Unable to fetch place information. Please try again.');
      setPlaceData(null);
    } finally {
      setIsLoadingPlace(false);
    }
  };

  const handlePlaceKeyPress = (e) => {
    if (e.key === 'Enter' && placeId && !isLoadingPlace) {
      handleLookupPlace();
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-3 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">AmpUp Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">✓ Successfully logged in as {username}</p>
          </div>

          {/* Place Lookup Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Look Up Place Information</h2>
            
            {placeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{placeError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="number"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                onKeyPress={handlePlaceKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter place ID (e.g., 3881)"
                disabled={isLoadingPlace}
              />
              <button
                onClick={handleLookupPlace}
                disabled={isLoadingPlace || !placeId}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingPlace ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Lookup'
                )}
              </button>
            </div>

            {placeData && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Place Details:</h3>
                <pre className="bg-white p-4 rounded border border-gray-200 overflow-auto text-xs max-h-96">
                  {JSON.stringify(placeData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Session Information</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600"><span className="font-medium">Username:</span> {username}</p>
              {authToken && (
                <p className="text-gray-600 break-all">
                  <span className="font-medium">Auth Token:</span> {authToken.substring(0, 40)}...
                </p>
              )}
              {userData && (
                <div className="mt-4">
                  <p className="font-medium text-gray-700 mb-2">Login Response Data:</p>
                  <pre className="bg-white p-4 rounded border border-gray-200 overflow-auto text-xs max-h-96">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Ready to control your EV chargers! Additional features coming soon.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-green-500 p-4 rounded-2xl">
            <Zap className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          AmpUp Control
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to manage your EV chargers
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Connect to your AmpUp account to start charging
        </div>
      </div>
    </div>
  );
}