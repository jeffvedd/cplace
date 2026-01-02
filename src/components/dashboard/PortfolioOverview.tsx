import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useTranslation } from 'react-i18next';

export const PortfolioOverview = () => {
  const { t } = useTranslation();
  const { portfolio } = useCryptoStore();
  const isPositive = portfolio.changePercent24h >= 0;

  const stats = [
    {
      label: t('common.portfolioValue'),
      value: formatCurrency(portfolio.totalValue),
      icon: Wallet,
      color: 'text-primary',
    },
    {
      label: t('portfolio.change24h'),
      value: formatCurrency(Math.abs(portfolio.change24h)),
      subValue: formatPercent(portfolio.changePercent24h),
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-success' : 'text-destructive',
    },
    {
      label: t('portfolio.totalRoi'),
      value: formatCurrency(portfolio.roi),
      subValue: formatPercent(portfolio.roiPercent),
      icon: Target,
      color: portfolio.roiPercent >= 0 ? 'text-success' : 'text-destructive',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          className="glass-card rounded-2xl p-6 glow-primary"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.subValue && (
                <p className={`text-sm font-medium mt-1 ${stat.color}`}>
                  {stat.subValue}
                </p>
              )}
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
