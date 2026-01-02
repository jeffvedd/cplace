import { Layout } from '@/components/layout/Layout';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { AssetList } from '@/components/dashboard/AssetList';
import { LivePriceStatus } from '@/components/dashboard/LivePriceStatus';
import { motion } from 'framer-motion';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
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
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
          </div>
          <LivePriceStatus 
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={refreshPrices}
          />
        </div>

        <PortfolioOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioChart />
          <AssetList />
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
