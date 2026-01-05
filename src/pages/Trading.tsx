import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletOverview } from '@/components/trading/WalletOverview';
import { ROITracker } from '@/components/trading/ROITracker';
import { BuyForm } from '@/components/trading/BuyForm';
import { SellForm } from '@/components/trading/SellForm';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, ShoppingCart, ArrowDownToLine } from 'lucide-react';

const Trading = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            {t('trading.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('trading.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">{t('trading.tabs.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('trading.tabs.roi')}</span>
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t('trading.tabs.buy')}</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              <span className="hidden sm:inline">{t('trading.tabs.sell')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <WalletOverview />
          </TabsContent>

          <TabsContent value="roi" className="mt-6">
            <ROITracker />
          </TabsContent>

          <TabsContent value="buy" className="mt-6">
            <BuyForm />
          </TabsContent>

          <TabsContent value="sell" className="mt-6">
            <SellForm />
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default Trading;
