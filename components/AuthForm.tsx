import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // final validation (should already be caught by live check)
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '0 auto',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #3a2d1a',
        borderRadius: 10,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          marginBottom: 20,
          borderBottom: '1px solid #3a2d1a',
        }}
      >
        <button
          onClick={() => setIsLogin(true)}
          style={{
            flex: 1,
            padding: '10px',
            background: isLogin ? '#d4a843' : 'transparent',
            color: isLogin ? '#0e0b06' : '#f0e6d0',
            border: 'none',
            borderRadius: '6px 0 0 0',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
          }}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          style={{
            flex: 1,
            padding: '10px',
            background: !isLogin ? '#d4a843' : 'transparent',
            color: !isLogin ? '#0e0b06' : '#f0e6d0',
            border: 'none',
            borderRadius: '0 6px 0 0',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
          }}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              background: '#1a1208',
              border: '1px solid #4a3820',
              borderRadius: 6,
              padding: '12px',
              color: '#f0e6d0',
              fontFamily: 'Crimson Text, Georgia, serif',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              setPassword(val);
              if (!isLogin && confirmPassword && val !== confirmPassword) {
                setError('Passwords do not match');
              } else {
                setError('');
              }
            }}
            required
            style={{
              width: '100%',
              background: '#1a1208',
              border: '1px solid #4a3820',
              borderRadius: 6,
              padding: '12px',
              color: '#f0e6d0',
              fontFamily: 'Crimson Text, Georgia, serif',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {!isLogin && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value;
                setConfirmPassword(val);
                if (!isLogin && password && val !== password) {
                  setError('Passwords do not match');
                } else {
                  setError('');
                }
              }}
              required
              style={{
                width: '100%',
                background: '#1a1208',
                border: '1px solid #4a3820',
                borderRadius: 6,
                padding: '12px',
                color: '#f0e6d0',
                fontFamily: 'Crimson Text, Georgia, serif',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
        {error && (
          <div
            style={{
              color: '#c0392b',
              fontSize: 12,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || (!isLogin && password !== confirmPassword)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6b4c1e, #4a3210)',
            border: '1px solid #8b6b3a',
            borderRadius: 6,
            padding: '12px',
            color: '#d4a843',
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;