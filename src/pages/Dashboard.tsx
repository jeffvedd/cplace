import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window { google: any; }
}

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const btnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Callback called by Google Identity Services
    const handleCredentialResponse = (response: any) => {
      // response.credential is a JWT token returned by Google
      if (response?.credential) {
        localStorage.setItem('cplace_token', response.credential);
        // redirect to root after sign in
        navigate('/', { replace: true });
      }
    };

    if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // render the button in the placeholder div
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        });
      }

      // optional: prompt one-tap
      // window.google.accounts.id.prompt();
    }
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-2xl glass-card">
          <h2 className="text-2xl font-bold mb-2">{t('auth.title') || 'Entrar / Cadastrar'}</h2>
          <p className="text-muted-foreground mb-6">{t('auth.subtitle') || 'Use sua conta Google para entrar'}</p>

          <div ref={btnRef} className="mb-4" />

          <div className="text-sm text-muted-foreground mt-4">
            {t('auth.privacy') || 'Ao entrar você concorda com os termos de uso.'}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
