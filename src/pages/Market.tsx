import { Layout } from '@/components/layout/Layout';
import { TradingChart } from '@/components/trade/TradingChart';
import { OrderBook } from '@/components/trade/OrderBook';
import { AssetSelector } from '@/components/trade/AssetSelector';
import { LivePriceStatus } from '@/components/dashboard/LivePriceStatus';
import { motion } from 'framer-motion';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useTranslation } from 'react-i18next';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

const Market = () => {
  const { t } = useTranslation();
  const { isLoading, error, lastUpdated, refreshPrices } = useLivePrices();
  const { selectedAsset, toggleWatchlist, isInWatchlist } = useCryptoStore();

  const isPositive = (selectedAsset?.changePercent24h || 0) >= 0;
  const inWatchlist = selectedAsset ? isInWatchlist(selectedAsset.symbol) : false;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('market.title')}</h1>
            <p className="text-muted-foreground">{t('market.subtitle')}</p>
          </div>
          <LivePriceStatus 
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={refreshPrices}
          />
        </div>

        {/* Selected Asset Info */}
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                  {selectedAsset.icon || selectedAsset.symbol[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                    <span className="text-lg text-muted-foreground">({selectedAsset.symbol})</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-3xl font-bold">{formatCurrency(selectedAsset.price)}</span>
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      <span className="text-lg font-semibold">{formatPercent(selectedAsset.changePercent24h)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleWatchlist(selectedAsset.symbol)}
                className={`p-3 rounded-xl transition-colors ${
                  inWatchlist 
                    ? 'bg-yellow-500/20 text-yellow-500' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                title={inWatchlist ? t('watchlist.remove') : t('watchlist.add')}
              >
                <Star className={`h-6 w-6 ${inWatchlist ? 'fill-yellow-500' : ''}`} />
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left sidebar - Asset Selector */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <AssetSelector />
          </div>

          {/* Main content - Chart and Order Book */}
          <div className="xl:col-span-3 order-1 xl:order-2 space-y-6">
            <TradingChart />
            <OrderBook />
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Market;
