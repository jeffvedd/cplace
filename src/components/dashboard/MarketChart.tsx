import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createChart, IChartApi, ISeriesApi, AreaSeries, AreaData, Time } from 'lightweight-charts';
import { useCryptoStore } from '@/store/cryptoStore';
import { fadeInUp } from '@/lib/animations';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';

type TimeFrame = '1D' | '7D' | '30D';

// Generate price history based on current price
const generatePriceHistory = (basePrice: number, days: number): { time: number; value: number }[] => {
  const data: { time: number; value: number }[] = [];
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 100;
  
  let price = basePrice * 0.9; // Start 10% lower to show growth

  for (let i = 100; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * (basePrice * 0.02); // Small fluctuations
    price = Math.max(price + change, basePrice * 0.7);

    data.push({
      time: Math.floor(time / 1000),
      value: price,
    });
  }

  // Ensure last value is close to current price
  if (data.length > 0) {
    data[data.length - 1].value = basePrice;
  }

  return data;
};

export const MarketChart = () => {
  const { t } = useTranslation();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7D');
  const { selectedAsset } = useCryptoStore();

  const timeFrameDays: Record<TimeFrame, number> = {
    '1D': 1,
    '7D': 7,
    '30D': 30,
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          labelVisible: false,
        },
      },
    });

    seriesRef.current = chartRef.current.addSeries(AreaSeries, {
      lineColor: '#6366F1',
      topColor: 'rgba(99, 102, 241, 0.4)',
      bottomColor: 'rgba(99, 102, 241, 0.0)',
      lineWidth: 2,
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !selectedAsset) return;

    const data = generatePriceHistory(selectedAsset.price, timeFrameDays[timeFrame]);
    const chartData: AreaData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      value: d.value,
    }));

    seriesRef.current.setData(chartData);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [timeFrame, selectedAsset]);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedAsset?.name || 'Bitcoin'} ({selectedAsset?.symbol || 'BTC'})
          </h3>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(selectedAsset?.price || 0)}
          </p>
        </div>
        <div className="flex gap-2">
          {(['1D', '7D', '30D'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFrame === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </motion.div>
  );
};
