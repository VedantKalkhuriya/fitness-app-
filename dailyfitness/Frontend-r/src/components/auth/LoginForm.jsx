import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { authApi } from '../../utils/api';

export default function LoginForm({ onError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    onError('');
    if (!username.trim() || !password) {
      onError('Enter your username and password to continue.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (import.meta.env.DEV && username.trim() === 'demo' && password === 'demo@1234') {
        dispatch(setCredentials({ token: 'demo-preview-token', userId: 1, userName: 'Demo User' }));
        navigate('/dashboard/overview');
        return;
      }
      const data = await authApi.login(username.trim(), password);
      dispatch(setCredentials({ token: data.token, userId: data.userId, userName: data.name }));
      navigate('/dashboard/overview');
    } catch (error) {
      onError(error.message || 'Unable to sign in. Check your username and password, then try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit} className="auth-form" noValidate>
    <label className="auth-field"><span>Username</span><div className="auth-input-wrap"><i aria-hidden="true">@</i><input type="text" autoComplete="username" autoCapitalize="none" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" required/></div></label>
    <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><i aria-hidden="true">●</i><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required/></div></label>
    <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? <><i className="auth-spinner"/>Signing in…</> : <>Sign in <span>→</span></>}</button>
  </form>;
}
