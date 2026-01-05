import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fetchROI, ROIData, AssetROI } from '@/services/tradingService';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const ROITracker = () => {
  const { t } = useTranslation();
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadROI = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchROI();
      setRoiData(data);
    } catch (err) {
      console.error('Error loading ROI:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ROI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadROI();
  }, []);

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadROI} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPositive = (roiData?.roi_percent || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* ROI Summary Card */}
      <Card className={`glass-card ${isPositive ? 'border-success/30' : 'border-destructive/30'}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            {t('trading.roi.summary')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={loadROI} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('trading.roi.invested')}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(roiData?.total_invested || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('trading.roi.currentValue')}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(roiData?.current_value || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('trading.roi.profitLoss')}</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(roiData?.profit_loss || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('trading.roi.totalROI')}</p>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                  <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(roiData?.roi_percent || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets ROI List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t('trading.roi.byAsset')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : roiData?.assets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('trading.roi.noAssets')}
            </p>
          ) : (
            <div className="space-y-4">
              {roiData?.assets.map((asset, index) => (
                <AssetROICard key={asset.symbol} asset={asset} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AssetROICard = ({ asset, index }: { asset: AssetROI; index: number }) => {
  const { t } = useTranslation();
  const isPositive = asset.roi_percent >= 0;
  
  // Calculate progress for visual representation (capped at 100%)
  const progressValue = Math.min(Math.abs(asset.roi_percent), 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 rounded-lg bg-secondary/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-bold text-primary">{asset.symbol[0]}</span>
          </div>
          <div>
            <p className="font-semibold">{asset.symbol}</p>
            <p className="text-sm text-muted-foreground">
              {asset.quantity.toFixed(8)} @ {formatCurrency(asset.current_price)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <Badge variant={isPositive ? 'default' : 'destructive'}>
              {formatPercent(asset.roi_percent)}
            </Badge>
          </div>
          <p className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{formatCurrency(asset.profit_loss)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{t('trading.roi.invested')}</p>
          <p className="font-medium">{formatCurrency(asset.invested)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('trading.roi.currentValue')}</p>
          <p className="font-medium">{formatCurrency(asset.current_value)}</p>
        </div>
        <div>
          <Progress 
            value={progressValue} 
            className={`h-2 ${isPositive ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`} 
          />
        </div>
      </div>
    </motion.div>
  );
};
