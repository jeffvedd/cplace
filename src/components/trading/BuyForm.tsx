import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOrderPreview, placeBuyOrder, OrderPreview } from '@/services/tradingService';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, AlertCircle, CheckCircle2, Loader2, Calculator } from 'lucide-react';
import { useCryptoStore } from '@/store/cryptoStore';
import { toast } from 'sonner';

const TRADING_PAIRS = [
  { id: 'BTC-USD', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ETH-USD', name: 'Ethereum', symbol: 'ETH' },
  { id: 'SOL-USD', name: 'Solana', symbol: 'SOL' },
  { id: 'ADA-USD', name: 'Cardano', symbol: 'ADA' },
  { id: 'XRP-USD', name: 'Ripple', symbol: 'XRP' },
  { id: 'DOT-USD', name: 'Polkadot', symbol: 'DOT' },
  { id: 'AVAX-USD', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'MATIC-USD', name: 'Polygon', symbol: 'MATIC' },
  { id: 'LINK-USD', name: 'Chainlink', symbol: 'LINK' },
  { id: 'UNI-USD', name: 'Uniswap', symbol: 'UNI' },
];

export const BuyForm = () => {
  const { t } = useTranslation();
  const { assets } = useCryptoStore();
  
  const [selectedPair, setSelectedPair] = useState('BTC-USD');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedAsset = assets.find(a => `${a.symbol}-USD` === selectedPair);

  const handleGetPreview = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('trading.buy.invalidAmount'));
      return;
    }

    try {
      setIsLoadingPreview(true);
      setError(null);
      const previewData = await getOrderPreview(selectedPair, 'BUY', amount);
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
      
      const result = await placeBuyOrder(selectedPair, amount);
      
      if (result.success) {
        setSuccess(true);
        setPreview(null);
        setAmount('');
        toast.success(t('trading.buy.success'));
        
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to place order');
        toast.error(result.error || t('trading.buy.failed'));
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
    // Only allow valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setPreview(null);
      setError(null);
    }
  };

  return (
    <Card className="glass-card max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-success" />
          {t('trading.buy.title')}
        </CardTitle>
        <CardDescription>
          {t('trading.buy.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selector */}
        <div className="space-y-2">
          <Label>{t('trading.buy.selectAsset')}</Label>
          <Select value={selectedPair} onValueChange={(v) => {
            setSelectedPair(v);
            setPreview(null);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADING_PAIRS.map((pair) => (
                <SelectItem key={pair.id} value={pair.id}>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{pair.symbol}</span>
                    <span className="text-muted-foreground">- {pair.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAsset && (
            <p className="text-sm text-muted-foreground">
              {t('trading.currentPrice')}: {formatCurrency(selectedAsset.price)}
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>{t('trading.buy.amountUSD')}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="100.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            {[10, 50, 100, 500].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                onClick={() => handleAmountChange(val.toString())}
              >
                ${val}
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
          {t('trading.buy.preview')}
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
                <h4 className="font-semibold">{t('trading.buy.orderSummary')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{t('trading.buy.amount')}:</span>
                  <span className="text-right font-medium">{formatCurrency(preview.quote_amount || 0)}</span>
                  
                  <span className="text-muted-foreground">{t('trading.buy.estimatedFee')}:</span>
                  <span className="text-right font-medium text-warning">{formatCurrency(preview.estimated_fee)}</span>
                  
                  <span className="text-muted-foreground">{t('trading.buy.youWillReceive')}:</span>
                  <span className="text-right font-medium text-success">
                    ~{preview.estimated_quantity?.toFixed(8)} {selectedPair.split('-')[0]}
                  </span>
                  
                  <span className="text-muted-foreground">{t('trading.currentPrice')}:</span>
                  <span className="text-right font-medium">{formatCurrency(preview.current_price)}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-success hover:bg-success/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {t('trading.buy.confirm')}
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
                  {t('trading.buy.orderPlaced')}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
