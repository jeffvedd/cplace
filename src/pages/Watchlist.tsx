import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCompactNumber } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Watchlist = () => {
  const { t } = useTranslation();
  const { assets, watchlist, toggleWatchlist, setSelectedAsset } = useCryptoStore();
  const navigate = useNavigate();

  const watchlistAssets = assets.filter(asset => watchlist.includes(asset.symbol));

  const handleAssetClick = (asset: typeof assets[0]) => {
    setSelectedAsset(asset);
    navigate('/market');
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('watchlist.title')}</h1>
          <p className="text-muted-foreground">{t('watchlist.subtitle')}</p>
        </div>

        {watchlistAssets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <Star className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {t('watchlist.empty')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('watchlist.addHint')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground w-16"></th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('rankings.asset')}</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('common.price')}</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('common.change24h')}</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('common.volume')}</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t('common.marketCap')}</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistAssets.map((asset) => {
                    const isPositive = asset.changePercent24h >= 0;
                    
                    return (
                      <motion.tr
                        key={asset.id}
                        variants={staggerItem}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleAssetClick(asset)}
                      >
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(asset.symbol);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={t('watchlist.remove')}
                          >
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          </button>
                        </td>
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
                        <td className="p-4 text-right">
                          <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span className="font-medium">{formatPercent(asset.changePercent24h)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-muted-foreground hidden md:table-cell">
                          {formatCompactNumber(asset.volume24h)}
                        </td>
                        <td className="p-4 text-right font-semibold hidden lg:table-cell">
                          {formatCompactNumber(asset.marketCap)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Watchlist;
