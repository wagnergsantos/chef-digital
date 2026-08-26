import { useState } from 'react';
import { signInWithPassword } from '../../auth/session.js';
import adminUi from './AdminUI.module.css';
import styles from './LoginForm.module.css';

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
    <div className={styles.wrapper}>
      <div className={styles.navContainer}>
        <a href="index.html" className={`${adminUi.btn} ${adminUi.btnSecondary} ${adminUi.btnLink}`}>
          ← Voltar ao Livro de Receitas
        </a>
      </div>
      <form id="login-container" className={`${adminUi.card} ${styles.loginContainer}`} onSubmit={handleSubmit}>
        <h2 className={adminUi.sectionTitle} style={{ marginTop: 0 }}>Acesso Administrativo</h2>
      <div className={adminUi.formGroup}>
        <label className={adminUi.formLabel} htmlFor="email">E-mail</label>
        <input
          type="email"
          id="email"
          className={adminUi.formInput}
          placeholder="seu-email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={adminUi.formGroup}>
        <label className={adminUi.formLabel} htmlFor="password">Senha</label>
        <input
          type="password"
          id="password"
          className={adminUi.formInput}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {errorMsg && (
        <div id="login-error" className={adminUi.errorBox} style={{ display: 'block' }}>
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        id="btn-login"
        className={`${adminUi.btn} ${adminUi.btnPrimary}`}
        style={{ width: '100%', padding: '14px' }}
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      </form>
    </div>
  );
}
