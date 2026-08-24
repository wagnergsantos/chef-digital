import { useState } from 'react';
import { signInWithPassword } from '../../auth/session.js';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setErrorMsg('');

    if (!cleanEmail || !password) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await signInWithPassword(cleanEmail, password);
    } catch (err) {
      setErrorMsg('Erro ao fazer login: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="login-container" className="max-w-md mx-auto admin-card admin-login-container" onSubmit={handleSubmit}>
      <h2 className="section-title" style={{ marginTop: 0 }}>Acesso Administrativo</h2>
      <div className="form-group">
        <label className="form-label" htmlFor="email">E-mail</label>
        <input
          type="email"
          id="email"
          className="form-input"
          placeholder="seu-email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="password">Senha</label>
        <input
          type="password"
          id="password"
          className="form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {errorMsg && (
        <div id="login-error" className="admin-error-box" style={{ display: 'block' }}>
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        id="btn-login"
        className="admin-btn admin-btn-primary admin-btn-full"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
