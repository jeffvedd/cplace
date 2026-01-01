import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency } from '@/lib/formatters';
import { fadeInUp } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

type OrderType = 'market' | 'limit' | 'stop-limit';
type OrderSide = 'buy' | 'sell';

export const OrderForm = () => {
  const { selectedAsset } = useCryptoStore();
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  const estimatedTotal = parseFloat(amount || '0') * (orderType === 'market' 
    ? (selectedAsset?.price || 0) 
    : parseFloat(price || '0'));

  const fee = estimatedTotal * 0.001; // 0.1% fee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: `${orderSide === 'buy' ? 'Buy' : 'Sell'} Order Placed`,
      description: `${amount} ${selectedAsset?.symbol} at ${orderType === 'market' ? 'market price' : formatCurrency(parseFloat(price))}`,
    });

    setAmount('');
    setPrice('');
    setStopPrice('');
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="font-semibold mb-4">Place Order</h3>

      {/* Order Type Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
        {(['market', 'limit', 'stop-limit'] as OrderType[]).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors capitalize ${
              orderType === type
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setOrderSide('buy')}
          className={`py-3 rounded-lg font-semibold transition-colors ${
            orderSide === 'buy'
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`py-3 rounded-lg font-semibold transition-colors ${
            orderSide === 'sell'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Price Input (for limit and stop-limit orders) */}
        {orderType !== 'market' && (
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        )}

        {/* Stop Price (for stop-limit orders) */}
        {orderType === 'stop-limit' && (
          <div className="space-y-2">
            <Label htmlFor="stop-price">Stop Price (USD)</Label>
            <Input
              id="stop-price"
              type="number"
              placeholder="0.00"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({selectedAsset?.symbol})</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-muted/50"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => setAmount((1 * percent / 100).toString())}
              className="py-1.5 text-xs font-medium bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              {percent}%
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Total</span>
            <span className="font-medium">{formatCurrency(estimatedTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee (0.1%)</span>
            <span className="font-medium">{formatCurrency(fee)}</span>
          </div>
          <div className="flex justify-between border-t border-border/50 pt-2">
            <span className="font-medium">Total</span>
            <span className="font-bold">{formatCurrency(estimatedTotal + fee)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className={`w-full py-6 text-lg font-semibold ${
            orderSide === 'buy'
              ? 'bg-success hover:bg-success/90'
              : 'bg-destructive hover:bg-destructive/90'
          }`}
        >
          {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedAsset?.symbol}
        </Button>
      </form>
    </motion.div>
  );
};
