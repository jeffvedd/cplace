import { motion } from 'framer-motion';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCompactNumber } from '@/lib/formatters';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssetList = () => {
  const { assets, setSelectedAsset } = useCryptoStore();
  const navigate = useNavigate();

  const handleAssetClick = (asset: typeof assets[0]) => {
    setSelectedAsset(asset);
    navigate('/trade');
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-semibold">Top Assets</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">24h Change</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Volume</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => {
              const isPositive = asset.changePercent24h >= 0;
              return (
                <motion.tr
                  key={asset.id}
                  variants={staggerItem}
                  onClick={() => handleAssetClick(asset)}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-white">
                        {asset.icon || asset.symbol[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(asset.price)}
                  </td>
                  <td className="p-4 text-right hidden sm:table-cell">
                    <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-medium">{formatPercent(asset.changePercent24h)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-muted-foreground hidden md:table-cell">
                    {formatCompactNumber(asset.volume24h)}
                  </td>
                  <td className="p-4 text-right text-muted-foreground hidden lg:table-cell">
                    {formatCompactNumber(asset.marketCap)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
