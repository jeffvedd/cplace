import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity, Zap } from 'lucide-react';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent, formatCompactNumber } from '@/lib/formatters';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useTranslation } from 'react-i18next';

export const MarketOverview = () => {
  const { t } = useTranslation();
  const { marketStats } = useCryptoStore();

  const stats = [
    {
      label: t('marketStats.totalMarketCap'),
      value: formatCompactNumber(marketStats.totalMarketCap),
      icon: BarChart3,
      color: 'text-primary',
    },
    {
      label: t('marketStats.totalVolume'),
      value: formatCompactNumber(marketStats.totalVolume24h),
      icon: Activity,
      color: 'text-accent',
    },
    {
      label: t('marketStats.btcDominance'),
      value: `${marketStats.btcDominance.toFixed(1)}%`,
      icon: Zap,
      color: 'text-warning',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          className="glass-card rounded-2xl p-6 glow-primary"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-primary/10 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
