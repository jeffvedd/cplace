import { Layout } from '@/components/layout/Layout';
import { TradingChart } from '@/components/trade/TradingChart';
import { OrderBook } from '@/components/trade/OrderBook';
import { OrderForm } from '@/components/trade/OrderForm';
import { AssetSelector } from '@/components/trade/AssetSelector';
import { LivePriceStatus } from '@/components/dashboard/LivePriceStatus';
import { motion } from 'framer-motion';
import { useLivePrices } from '@/hooks/useLivePrices';

const Trade = () => {
  const { isLoading, error, lastUpdated, refreshPrices } = useLivePrices();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trade</h1>
            <p className="text-muted-foreground">Buy and sell cryptocurrencies with real-time pricing.</p>
          </div>
          <LivePriceStatus 
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={refreshPrices}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left sidebar - Asset Selector */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <AssetSelector />
          </div>

          {/* Main content - Chart and Order Book */}
          <div className="xl:col-span-2 order-1 xl:order-2 space-y-6">
            <TradingChart />
            <OrderBook />
          </div>

          {/* Right sidebar - Order Form */}
          <div className="xl:col-span-1 order-3">
            <OrderForm />
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Trade;
