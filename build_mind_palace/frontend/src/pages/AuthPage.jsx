import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateAuthForm } from '../utils/validation';

const initialForm = { username: '', email: '', password: '' };

const errorMessages = {
  'Invalid credentials': 'Невалидна електронна поща или парола.',
  'Missing required fields': 'Необходимо е всички задължителни полета да са попълнени.',
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const updateForm = (updates) => {
    setForm((current) => ({ ...current, ...updates }));
    if (error) setError('');
  };

  const toggleMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError('');
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateAuthForm(mode, form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') await login({ email: form.email.trim(), password: form.password });
      else await register({ ...form, username: form.username.trim(), email: form.email.trim() });
      navigate('/spaces');
    } catch (err) {
      const message = String(err);
      setError(errorMessages[message] || message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div>
          <span className="eyebrow">Достъп</span>
          <h1>{mode === 'login' ? 'Вход в системата' : 'Създаване на профил'}</h1>
          <p className="muted">Достъп за подреждане на пространства, места, преговаряне и самопроверка.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Потребителско име
              <input value={form.username} onChange={(e) => updateForm({ username: e.target.value })} required />
            </label>
          )}
          <label>
            Електронна поща
            <input type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} required />
          </label>
          <label>
            Парола
            <input type="password" value={form.password} onChange={(e) => updateForm({ password: e.target.value })} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Изчакване…' : mode === 'login' ? 'Вход' : 'Създаване на профил'}
          </button>
        </form>

        <button className="text-button" onClick={toggleMode}>
          {mode === 'login' ? 'Нов профил? Регистрация' : 'Съществуващ профил? Вход'}
        </button>
      </div>
    </div>
  );
}
