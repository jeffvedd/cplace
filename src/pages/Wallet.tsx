import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Copy, Check, RefreshCw, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/useWallet';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatCryptoAmount } from '@/lib/formatters';
import { containerVariants, itemVariants } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';

const SUPPORTED_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
];

export default function Wallet() {
  const { t } = useTranslation();
  const { wallet, holdings, transactions, loading, createPixDeposit, checkPaymentStatus, buyCrypto, sellCrypto, getCryptoPrice } = useWallet();
  const { assets } = useCryptoStore();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; transaction_id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [cryptoPrice, setCryptoPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [processingTrade, setProcessingTrade] = useState(false);

  // Calculate total portfolio value
  const totalPortfolioValue = holdings.reduce((total, holding) => {
    const assetData = assets.find(a => a.symbol === holding.symbol);
    const currentPrice = assetData?.price || holding.avg_buy_price;
    return total + (holding.amount * currentPrice);
  }, 0) + (wallet?.brl_balance || 0);

  // Fetch crypto price when dialog opens or crypto changes
  useEffect(() => {
    if (tradeDialogOpen && selectedCrypto) {
      setLoadingPrice(true);
      getCryptoPrice(selectedCrypto).then((price) => {
        setCryptoPrice(price);
        setLoadingPrice(false);
      });
    }
  }, [tradeDialogOpen, selectedCrypto, getCryptoPrice]);

  const handleCreateDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10) {
      return;
    }

    const result = await createPixDeposit(amount);
    if (result) {
      setPixData({
        qr_code: result.pix.qr_code,
        qr_code_base64: result.pix.qr_code_base64,
        transaction_id: result.transaction.id,
      });
    }
  };

  const handleCheckPayment = async () => {
    if (!pixData) return;
    
    setCheckingPayment(true);
    const result = await checkPaymentStatus(pixData.transaction_id);
    setCheckingPayment(false);
    
    if (result?.status === 'completed') {
      setPixData(null);
      setDepositAmount('');
      setDepositDialogOpen(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrade = async () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setProcessingTrade(true);
    
    if (tradeType === 'buy') {
      await buyCrypto(selectedCrypto, amount);
    } else {
      await sellCrypto(selectedCrypto, amount);
    }
    
    setProcessingTrade(false);
    setTradeAmount('');
    setTradeDialogOpen(false);
  };

  const getHoldingForCrypto = (symbol: string) => {
    return holdings.find(h => h.symbol === symbol);
  };

  const calculateEstimate = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || !cryptoPrice) return null;
    
    const fee = amount * 0.029;
    
    if (tradeType === 'buy') {
      const cryptoAmount = (amount - fee) / cryptoPrice;
      return { cryptoAmount, fee, total: amount };
    } else {
      const brlAmount = amount * cryptoPrice;
      const netAmount = brlAmount - (brlAmount * 0.029);
      return { brlAmount: netAmount, fee: brlAmount * 0.029, total: brlAmount };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-4 space-y-6"
    >
      {/* Balance Overview */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Minha Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Saldo em BRL</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(wallet?.brl_balance || 0, 'BRL')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Crypto</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalPortfolioValue - (wallet?.brl_balance || 0), 'BRL')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(totalPortfolioValue, 'BRL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Depositar via PIX
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Depositar via PIX</DialogTitle>
            </DialogHeader>
            
            <AnimatePresence mode="wait">
              {!pixData ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium">Valor do depósito (R$)</label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa: 2.90% | Mínimo: R$ 10,00
                    </p>
                  </div>
                  
                  {depositAmount && parseFloat(depositAmount) >= 10 && (
                    <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Valor:</span>
                        <span>{formatCurrency(parseFloat(depositAmount), 'BRL')}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxa (2.90%):</span>
                        <span>{formatCurrency(parseFloat(depositAmount) * 0.029, 'BRL')}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total a pagar:</span>
                        <span>{formatCurrency(parseFloat(depositAmount) * 1.029, 'BRL')}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleCreateDeposit} 
                    className="w-full"
                    disabled={!depositAmount || parseFloat(depositAmount) < 10}
                  >
                    Gerar QR Code PIX
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center">
                    {pixData.qr_code_base64 ? (
                      <img 
                        src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Código PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <Input 
                        value={pixData.qr_code || ''} 
                        readOnly 
                        className="text-xs"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={handleCopyPix}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCheckPayment} 
                    className="w-full gap-2"
                    disabled={checkingPayment}
                  >
                    <RefreshCw className={`h-4 w-4 ${checkingPayment ? 'animate-spin' : ''}`} />
                    Verificar Pagamento
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setPixData(null)}
                    className="w-full"
                  >
                    Novo Depósito
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2" onClick={() => setTradeType('buy')}>
              <TrendingUp className="h-4 w-4" />
              Comprar Crypto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tradeType === 'buy' ? 'Comprar' : 'Vender'} Crypto</DialogTitle>
            </DialogHeader>
            
            <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Comprar
                </TabsTrigger>
                <TabsTrigger value="sell" className="gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Vender
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Criptomoeda</label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CRYPTOS.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          {crypto.symbol} - {crypto.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Valor em BRL</label>
                  <Input
                    type="number"
                    placeholder="100.00"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo disponível: {formatCurrency(wallet?.brl_balance || 0, 'BRL')}
                  </p>
                </div>
                
                {loadingPrice ? (
                  <Skeleton className="h-20 w-full" />
                ) : cryptoPrice && tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Preço atual:</span>
                      <span>{formatCurrency(cryptoPrice, 'BRL')}/{selectedCrypto}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa (2.90%):</span>
                      <span>{formatCurrency(parseFloat(tradeAmount) * 0.029, 'BRL')}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Você recebe:</span>
                      <span>~{formatCryptoAmount((parseFloat(tradeAmount) * 0.971) / cryptoPrice)} {selectedCrypto}</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleTrade} 
                  className="w-full"
                  disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || processingTrade || parseFloat(tradeAmount) > (wallet?.brl_balance || 0)}
                >
                  {processingTrade ? 'Processando...' : 'Comprar'}
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Criptomoeda</label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CRYPTOS.map((crypto) => {
                        const holding = getHoldingForCrypto(crypto.symbol);
                        return (
                          <SelectItem key={crypto.symbol} value={crypto.symbol}>
                            {crypto.symbol} - {crypto.name} {holding ? `(${formatCryptoAmount(holding.amount)})` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Quantidade de {selectedCrypto}</label>
                  <Input
                    type="number"
                    placeholder="0.001"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    step="0.00000001"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Disponível: {formatCryptoAmount(getHoldingForCrypto(selectedCrypto)?.amount || 0)} {selectedCrypto}
                  </p>
                </div>
                
                {loadingPrice ? (
                  <Skeleton className="h-20 w-full" />
                ) : cryptoPrice && tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Preço atual:</span>
                      <span>{formatCurrency(cryptoPrice, 'BRL')}/{selectedCrypto}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor bruto:</span>
                      <span>{formatCurrency(parseFloat(tradeAmount) * cryptoPrice, 'BRL')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa (2.90%):</span>
                      <span>{formatCurrency(parseFloat(tradeAmount) * cryptoPrice * 0.029, 'BRL')}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Você recebe:</span>
                      <span>{formatCurrency(parseFloat(tradeAmount) * cryptoPrice * 0.971, 'BRL')}</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleTrade} 
                  className="w-full"
                  disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || processingTrade || parseFloat(tradeAmount) > (getHoldingForCrypto(selectedCrypto)?.amount || 0)}
                >
                  {processingTrade ? 'Processando...' : 'Vender'}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Holdings */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Minhas Criptomoedas</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não possui criptomoedas. Faça um depósito e comece a investir!
              </p>
            ) : (
              <div className="space-y-3">
                {holdings.map((holding) => {
                  const assetData = assets.find(a => a.symbol === holding.symbol);
                  const currentPrice = assetData?.price || holding.avg_buy_price;
                  const currentValue = holding.amount * currentPrice;
                  const profit = currentValue - (holding.amount * holding.avg_buy_price);
                  const profitPercent = ((currentPrice - holding.avg_buy_price) / holding.avg_buy_price) * 100;
                  
                  return (
                    <div 
                      key={holding.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCryptoAmount(holding.amount)} @ {formatCurrency(holding.avg_buy_price, 'BRL')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(currentValue, 'BRL')}</p>
                        <p className={`text-sm ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit, 'BRL')} ({profitPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma transação realizada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-500' :
                        tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-500' :
                        tx.type === 'buy' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-orange-500/20 text-orange-500'
                      }`}>
                        {tx.type === 'deposit' && <ArrowDownCircle className="h-4 w-4" />}
                        {tx.type === 'withdrawal' && <ArrowUpCircle className="h-4 w-4" />}
                        {tx.type === 'buy' && <TrendingUp className="h-4 w-4" />}
                        {tx.type === 'sell' && <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {tx.type === 'deposit' ? 'Depósito' :
                           tx.type === 'withdrawal' ? 'Saque' :
                           tx.type === 'buy' ? `Compra ${tx.crypto_symbol}` :
                           `Venda ${tx.crypto_symbol}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.type === 'deposit' || tx.type === 'sell' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}
                        {formatCurrency(tx.amount, 'BRL')}
                      </p>
                      <p className={`text-xs ${
                        tx.status === 'completed' ? 'text-green-500' :
                        tx.status === 'pending' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {tx.status === 'completed' ? 'Concluído' :
                         tx.status === 'pending' ? 'Pendente' :
                         tx.status === 'failed' ? 'Falhou' : 'Cancelado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
