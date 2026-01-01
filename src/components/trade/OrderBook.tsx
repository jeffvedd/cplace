import { motion } from 'framer-motion';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatCryptoAmount } from '@/lib/formatters';
import { fadeInUp } from '@/lib/animations';
import { useEffect } from 'react';

export const OrderBook = () => {
  const { orderBook, refreshOrderBook } = useCryptoStore();

  useEffect(() => {
    const interval = setInterval(refreshOrderBook, 3000);
    return () => clearInterval(interval);
  }, [refreshOrderBook]);

  const maxTotal = Math.max(
    ...orderBook.bids.map((b) => b.total),
    ...orderBook.asks.map((a) => a.total)
  );

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Order Book</h3>
          <div className="text-xs text-muted-foreground">
            Spread: {formatCurrency(orderBook.spread)} ({orderBook.spreadPercent.toFixed(3)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 text-xs font-medium text-muted-foreground border-b border-border/30">
        <span>Price (USD)</span>
        <span className="text-center">Amount</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - reversed order */}
      <div className="max-h-48 overflow-y-auto scrollbar-thin">
        {[...orderBook.asks].reverse().map((ask, index) => (
          <div
            key={`ask-${index}`}
            className="relative grid grid-cols-3 gap-2 px-3 py-1.5 text-xs hover:bg-muted/30"
          >
            <div
              className="absolute inset-0 bg-destructive/10"
              style={{ width: `${(ask.total / maxTotal) * 100}%`, right: 0, left: 'auto' }}
            />
            <span className="relative text-destructive font-medium">{formatCurrency(ask.price)}</span>
            <span className="relative text-center">{formatCryptoAmount(ask.amount, 4)}</span>
            <span className="relative text-right text-muted-foreground">{formatCurrency(ask.total)}</span>
          </div>
        ))}
      </div>

      {/* Current Price */}
      <div className="px-3 py-2 bg-muted/50 border-y border-border/30">
        <div className="text-center font-bold text-lg">
          {formatCurrency(orderBook.bids[0]?.price || 0)}
        </div>
      </div>

      {/* Bids (Buys) */}
      <div className="max-h-48 overflow-y-auto scrollbar-thin">
        {orderBook.bids.map((bid, index) => (
          <div
            key={`bid-${index}`}
            className="relative grid grid-cols-3 gap-2 px-3 py-1.5 text-xs hover:bg-muted/30"
          >
            <div
              className="absolute inset-0 bg-success/10"
              style={{ width: `${(bid.total / maxTotal) * 100}%`, right: 0, left: 'auto' }}
            />
            <span className="relative text-success font-medium">{formatCurrency(bid.price)}</span>
            <span className="relative text-center">{formatCryptoAmount(bid.amount, 4)}</span>
            <span className="relative text-right text-muted-foreground">{formatCurrency(bid.total)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
