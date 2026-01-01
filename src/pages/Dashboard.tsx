import { Layout } from '@/components/layout/Layout';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { AssetList } from '@/components/dashboard/AssetList';
import { motion } from 'framer-motion';

const Dashboard = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your portfolio overview.</p>
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
