import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOrderPreview, placeSellOrder, fetchWallet, OrderPreview, WalletAccount } from '@/services/tradingService';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, AlertCircle, CheckCircle2, Loader2, Calculator, Wallet } from 'lucide-react';
import { useCryptoStore } from '@/store/cryptoStore';
import { toast } from 'sonner';

export const SellForm = () => {
  const { t } = useTranslation();
  const { assets } = useCryptoStore();
  
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedPair, setSelectedPair] = useState('');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const data = await fetchWallet();
      const cryptoAccounts = data.accounts.filter(a => a.currency !== 'USD' && a.balance > 0);
      setAccounts(cryptoAccounts);
      if (cryptoAccounts.length > 0) {
        setSelectedPair(`${cryptoAccounts[0].currency}-USD`);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const selectedAccount = accounts.find(a => `${a.currency}-USD` === selectedPair);
  const selectedAsset = assets.find(a => `${a.symbol}-USD` === selectedPair);

  const handleGetPreview = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('trading.sell.invalidAmount'));
      return;
    }

    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      setError(t('trading.sell.insufficientBalance'));
      return;
    }

    try {
      setIsLoadingPreview(true);
      setError(null);
      const previewData = await getOrderPreview(selectedPair, 'SELL', amount);
      setPreview(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await placeSellOrder(selectedPair, amount);
      
      if (result.success) {
        setSuccess(true);
        setPreview(null);
        setAmount('');
        toast.success(t('trading.sell.success'));
        
        // Refresh accounts
        loadAccounts();
        
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to place order');
        toast.error(result.error || t('trading.sell.failed'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setPreview(null);
      setError(null);
    }
  };

  const handleSetMax = () => {
    if (selectedAccount) {
      setAmount(selectedAccount.balance.toString());
      setPreview(null);
    }
  };

  const handleSetPercentage = (percent: number) => {
    if (selectedAccount) {
      const value = (selectedAccount.balance * percent / 100).toFixed(8);
      setAmount(value);
      setPreview(null);
    }
  };

  if (isLoadingAccounts) {
    return (
      <Card className="glass-card max-w-lg mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="glass-card max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('trading.sell.noAssets')}</h3>
          <p className="text-muted-foreground">{t('trading.sell.noAssetsDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-destructive" />
          {t('trading.sell.title')}
        </CardTitle>
        <CardDescription>
          {t('trading.sell.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selector */}
        <div className="space-y-2">
          <Label>{t('trading.sell.selectAsset')}</Label>
          <Select value={selectedPair} onValueChange={(v) => {
            setSelectedPair(v);
            setPreview(null);
            setAmount('');
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.uuid} value={`${account.currency}-USD`}>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{account.currency}</span>
                    <span className="text-muted-foreground">
                      ({account.balance.toFixed(8)})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAccount && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('trading.sell.available')}: {selectedAccount.balance.toFixed(8)} {selectedAccount.currency}</span>
              <span>≈ {formatCurrency(selectedAccount.usd_value)}</span>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{t('trading.sell.amount')}</Label>
            <Button variant="link" size="sm" onClick={handleSetMax} className="h-auto p-0">
              {t('trading.sell.max')}
            </Button>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                size="sm"
                onClick={() => handleSetPercentage(percent)}
              >
                {percent}%
              </Button>
            ))}
          </div>
        </div>

        {/* Get Preview Button */}
        <Button
          onClick={handleGetPreview}
          disabled={!amount || parseFloat(amount) <= 0 || isLoadingPreview}
          variant="secondary"
          className="w-full"
        >
          {isLoadingPreview ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          {t('trading.sell.preview')}
        </Button>

        {/* Order Preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                <h4 className="font-semibold">{t('trading.sell.orderSummary')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{t('trading.sell.selling')}:</span>
                  <span className="text-right font-medium">
                    {preview.base_amount} {selectedPair.split('-')[0]}
                  </span>
                  
                  <span className="text-muted-foreground">{t('trading.sell.grossValue')}:</span>
                  <span className="text-right font-medium">{formatCurrency(preview.quote_amount || 0)}</span>
                  
                  <span className="text-muted-foreground">{t('trading.sell.estimatedFee')}:</span>
                  <span className="text-right font-medium text-warning">{formatCurrency(preview.estimated_fee)}</span>
                  
                  <span className="text-muted-foreground">{t('trading.sell.youWillReceive')}:</span>
                  <span className="text-right font-medium text-success">
                    {formatCurrency(preview.net_amount)}
                  </span>
                  
                  <span className="text-muted-foreground">{t('trading.currentPrice')}:</span>
                  <span className="text-right font-medium">{formatCurrency(preview.current_price)}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {t('trading.sell.confirm')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="border-success bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  {t('trading.sell.orderPlaced')}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
