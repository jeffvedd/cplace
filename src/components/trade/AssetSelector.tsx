import { motion } from 'framer-motion';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCryptoAmount } from '@/lib/formatters';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const AssetSelector = () => {
  const { assets, selectedAsset, setSelectedAsset } = useCryptoStore();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold">Markets</h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {assets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id;
          const isPositive = asset.changePercent24h >= 0;

          return (
            <motion.button
              key={asset.id}
              variants={staggerItem}
              onClick={() => setSelectedAsset(asset)}
              className={`w-full flex items-center gap-3 p-4 transition-colors border-b border-border/30 last:border-0 ${
                isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-white shrink-0">
                {asset.icon || asset.symbol[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{asset.symbol}</span>
                  <span className="font-medium">{formatCurrency(asset.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">{asset.name}</span>
                  <span className={`flex items-center gap-1 text-sm ${
                    isPositive ? 'text-success' : 'text-destructive'
                  }`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatPercent(asset.changePercent24h)}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
