import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type WalletData = {
  balance: number;
  currency: string;
  // ... adapte ao shape real
};

export const WalletOverview = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WalletData | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/wallet'); // endpoint genérico, adapte se necessário
        if (!res.ok) {
          // log detalhado para facilitar debug da Edge Function
          const text = await res.text().catch(() => '');
          console.error('Wallet API returned non-2xx:', res.status, text);
          throw new Error(`Erro ao obter carteira (${res.status})`);
        }
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (err: any) {
        console.error('Wallet fetch error:', err);
        setError(err?.message || 'Erro desconhecido ao carregar carteira');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWallet();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-4">Carregando...</div>;

  if (error) return (
    <div className="p-4 rounded-md bg-destructive/10 text-destructive">
      <strong>{t('wallet.errorTitle') || 'Erro ao carregar carteira'}</strong>
      <div className="mt-2">{error}</div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="glass-card p-4 rounded-2xl">
      <div className="text-sm text-muted-foreground">Saldo</div>
      <div className="text-2xl font-bold">
        {data.balance} {data.currency}
      </div>
    </div>
  );
};
