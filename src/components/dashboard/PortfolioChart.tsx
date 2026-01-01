import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createChart, IChartApi, ISeriesApi, AreaSeries, AreaData, Time } from 'lightweight-charts';
import { generatePortfolioHistory } from '@/data/mockData';
import { fadeInUp } from '@/lib/animations';
import { formatCurrency } from '@/lib/formatters';

type TimeFrame = '7D' | '30D' | '90D';

export const PortfolioChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30D');
  const [currentValue, setCurrentValue] = useState<number>(0);

  const timeFrameDays: Record<TimeFrame, number> = {
    '7D': 7,
    '30D': 30,
    '90D': 90,
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
    if (!seriesRef.current) return;

    const data = generatePortfolioHistory(timeFrameDays[timeFrame]);
    const chartData: AreaData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      value: d.value,
    }));

    seriesRef.current.setData(chartData);
    
    if (chartData.length > 0) {
      setCurrentValue(chartData[chartData.length - 1].value);
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [timeFrame]);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-2xl font-bold mt-1">{formatCurrency(currentValue)}</p>
        </div>
        <div className="flex gap-2">
          {(['7D', '30D', '90D'] as TimeFrame[]).map((tf) => (
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
