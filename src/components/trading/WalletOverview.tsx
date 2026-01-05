import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fetchWallet, WalletData, WalletAccount } from '@/services/tradingService';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WalletOverview = () => {
  const { t } = useTranslation();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWallet();
      setWalletData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadWallet} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="glass-card glow-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('trading.wallet.totalBalance')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={loadWallet} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-4xl font-bold gradient-text">
                {formatCurrency(walletData?.total_usd_value || 0)}
              </p>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t('common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t('trading.wallet.accounts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : walletData?.accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('trading.wallet.noAccounts')}
            </p>
          ) : (
            <div className="space-y-3">
              {walletData?.accounts.map((account, index) => (
                <AccountCard key={account.uuid} account={account} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AccountCard = ({ account, index }: { account: WalletAccount; index: number }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="font-bold text-primary">{account.currency[0]}</span>
        </div>
        <div>
          <p className="font-semibold">{account.name}</p>
          <p className="text-sm text-muted-foreground">
            {account.balance.toFixed(8)} {account.currency}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(account.usd_value)}</p>
        <Badge variant="secondary" className="text-xs">
          {account.currency}
        </Badge>
      </div>
    </motion.div>
  );
};
