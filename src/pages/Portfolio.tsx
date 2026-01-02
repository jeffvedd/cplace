import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCryptoAmount } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Portfolio = () => {
  const { t } = useTranslation();
  const { assets, portfolio } = useCryptoStore();

  // Calculate holdings value for each asset
  const holdings = assets.map((asset) => ({
    ...asset,
    value: (asset.holdings || 0) * asset.price,
    allocation: ((asset.holdings || 0) * asset.price / portfolio.totalValue) * 100,
  })).filter((a) => a.holdings && a.holdings > 0);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('portfolio.title')}</h1>
          <p className="text-muted-foreground">{t('portfolio.subtitle')}</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('portfolio.totalValue')}</p>
            <p className="text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('portfolio.change24h')}</p>
            <p className={`text-3xl font-bold ${portfolio.changePercent24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercent(portfolio.changePercent24h)}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('portfolio.totalRoi')}</p>
            <p className={`text-3xl font-bold ${portfolio.roiPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercent(portfolio.roiPercent)}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('portfolio.assets')}</p>
            <p className="text-3xl font-bold">{holdings.length}</p>
          </motion.div>
        </div>

        {/* Holdings Table */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border/50 flex items-center gap-3">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('portfolio.holdings')}</h3>
          </div>
          
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('portfolio.asset')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('trade.amount')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('portfolio.price')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('portfolio.value')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('portfolio.change24h')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t('portfolio.allocation')}</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((asset) => {
                  const isPositive = asset.changePercent24h >= 0;
                  return (
                    <motion.tr
                      key={asset.id}
                      variants={staggerItem}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors"
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
                        {formatCryptoAmount(asset.holdings || 0)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(asset.price)}
                      </td>
                      <td className="p-4 text-right font-bold hidden sm:table-cell">
                        {formatCurrency(asset.value)}
                      </td>
                      <td className="p-4 text-right hidden md:table-cell">
                        <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="font-medium">{formatPercent(asset.changePercent24h)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {asset.allocation.toFixed(1)}%
                          </span>
                        </div>
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

export default Portfolio;
