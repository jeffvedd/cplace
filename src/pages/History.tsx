import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useCryptoStore } from '@/store/cryptoStore';
import { formatCurrency, formatCryptoAmount, formatDate } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Download, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

const History = () => {
  const { t } = useTranslation();
  const { trades, assets } = useCryptoStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');

  const filteredTrades = trades.filter((trade) => {
    if (filterType !== 'all' && trade.type !== filterType) return false;
    if (filterAsset !== 'all' && trade.asset !== filterAsset) return false;
    return true;
  });

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'Asset', 'Amount', 'Price', 'Total', 'Fee', 'Status'],
      ...filteredTrades.map((t) => [
        t.timestamp.toISOString(),
        t.type,
        t.asset,
        t.amount.toString(),
        t.price.toString(),
        t.total.toString(),
        t.fee.toString(),
        t.status,
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('history.completed');
      case 'pending': return t('history.pending');
      case 'failed': return t('history.failed');
      default: return status;
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('history.title')}</h1>
            <p className="text-muted-foreground">{t('history.subtitle')}</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('history.exportCsv')}
          </Button>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('history.filters')}:</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('history.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.allTypes')}</SelectItem>
                <SelectItem value="buy">{t('trade.buy')}</SelectItem>
                <SelectItem value="sell">{t('trade.sell')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('history.asset')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.allAssets')}</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.symbol}>
                    {asset.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions Table */}
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('history.date')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('history.type')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('history.asset')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('history.amount')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('history.price')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('history.total')}</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t('history.fee')}</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">{t('history.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <motion.tr
                    key={trade.id}
                    variants={staggerItem}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 text-sm">
                      {formatDate(trade.timestamp)}
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        trade.type === 'buy' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {trade.type === 'buy' ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {trade.type === 'buy' ? t('trade.buy').toUpperCase() : t('trade.sell').toUpperCase()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{trade.asset}</span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCryptoAmount(trade.amount)}
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      {formatCurrency(trade.price)}
                    </td>
                    <td className="p-4 text-right font-semibold hidden md:table-cell">
                      {formatCurrency(trade.total)}
                    </td>
                    <td className="p-4 text-right text-muted-foreground hidden lg:table-cell">
                      {formatCurrency(trade.fee)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : trade.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {getStatusLabel(trade.status)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTrades.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              {t('history.noTransactions')}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default History;
