import { useState } from 'react';
import { authApi } from './api/api';

function AccessCode({ onAccessCodeValidated }) {
  const [accessCode, setAccessCode] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showNewAccessCode, setShowNewAccessCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreateAccessCode = async () => {
    if (!/^[0-9]{6}$/.test(newAccessCode)) {
      setError('Access code must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await authApi.createAccessCode(newAccessCode);
      if (response.success) {
        setSuccessMessage(`Access code "${response.accessCode}" created successfully!`);
        setAccessCode(response.accessCode);
        setNewAccessCode('');
        setIsCreating(false);
      } else {
        setError(response.message || 'Failed to create access code');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessCodeSubmit = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    if (!/^[0-9]{6}$/.test(accessCode)) {
      setError('Access code must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.validateAccessCode(accessCode.trim());
      if (response.success) {
        onAccessCodeValidated(response.accessCode);
      } else {
        setError(response.message || 'Invalid access code');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAccessCode(value);
  };

  const handleNewAccessCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewAccessCode(value);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-black tracking-tight">Note Pro</h1>
          <p className="text-gray-500 mt-2">Your simple, secure note-taking app</p>
        </div>

        {/* Card */}
        <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-sm">
          {/* Toggle Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setIsCreating(!isCreating);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              {isCreating ? '← Back to login' : 'New user? Create access code'}
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-black mb-6">
            {isCreating ? 'Create Access Code' : 'Enter Access Code'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-black text-sm rounded-lg">
              <p className="font-medium">{successMessage}</p>
              <p className="text-gray-500 mt-1">You can now use this code to access your notes!</p>
            </div>
          )}

          {!isCreating ? (
            // Access Code Input Form
            <form onSubmit={handleAccessCodeSubmit} className="space-y-5">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code (6 digits)
                </label>
                <div className="relative">
                  <input
                    type={showAccessCode ? "text" : "password"}
                    id="accessCode"
                    value={accessCode}
                    onChange={handleAccessCodeChange}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors font-mono text-2xl tracking-[0.5em] text-center pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showAccessCode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {accessCode.length}/6 digits
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || accessCode.length !== 6}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Validating...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          ) : (
            // Create Access Code Form
            <div className="space-y-5">
              <div>
                <label htmlFor="newAccessCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Your Access Code (6 digits)
                </label>
                <div className="relative">
                  <input
                    type={showNewAccessCode ? "text" : "password"}
                    id="newAccessCode"
                    value={newAccessCode}
                    onChange={handleNewAccessCodeChange}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors font-mono text-2xl tracking-[0.5em] text-center pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAccessCode(!showNewAccessCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showNewAccessCode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {newAccessCode.length}/6 digits
                </p>
              </div>
              <button
                onClick={handleCreateAccessCode}
                disabled={isLoading || newAccessCode.length !== 6}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Access Code'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Your notes are secured with your unique 6-digit access code
        </p>
      </div>
    </div>
  );
}

export default AccessCode;
