import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCompactNumber } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { TrendingUp, TrendingDown, Trophy, Medal, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type SortBy = 'marketCap' | 'gainers' | 'losers';

const Rankings = () => {
  const { t } = useTranslation();
  const { assets } = useCryptoStore();
  const [sortBy, setSortBy] = useState<SortBy>('marketCap');

  const getSortedAssets = () => {
    const sorted = [...assets];
    switch (sortBy) {
      case 'gainers':
        return sorted.sort((a, b) => b.changePercent24h - a.changePercent24h);
      case 'losers':
        return sorted.sort((a, b) => a.changePercent24h - b.changePercent24h);
      case 'marketCap':
      default:
        return sorted.sort((a, b) => b.marketCap - a.marketCap);
    }
  };

  const sortedAssets = getSortedAssets();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('rankings.title')}</h1>
          <p className="text-muted-foreground">{t('rankings.subtitle')}</p>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSortBy('marketCap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'marketCap'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {t('rankings.byMarketCap')}
          </button>
          <button
            onClick={() => setSortBy('gainers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              sortBy === 'gainers'
                ? 'bg-success text-success-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            {t('rankings.gainers')}
          </button>
          <button
            onClick={() => setSortBy('losers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              sortBy === 'losers'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            {t('rankings.losers')}
          </button>
        </div>

        {/* Rankings Table */}
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-16">{t('rankings.rank')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('rankings.asset')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('rankings.price')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('rankings.change24h')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('rankings.volume24h')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t('rankings.marketCap')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.map((asset, index) => {
                  const isPositive = asset.changePercent24h >= 0;
                  const rank = index + 1;
                  
                  return (
                    <motion.tr
                      key={asset.id}
                      variants={staggerItem}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>
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
      </motion.div>
    </Layout>
  );
};

export default Rankings;
