import { CryptoAsset, OrderBook, ChartDataPoint } from '@/types/crypto';

export const mockAssets: CryptoAsset[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 67432.18,
    change24h: 1234.56,
    changePercent24h: 1.86,
    volume24h: 28500000000,
    marketCap: 1324000000000,
    icon: '₿',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3456.78,
    change24h: -45.23,
    changePercent24h: -1.29,
    volume24h: 15200000000,
    marketCap: 415000000000,
    icon: 'Ξ',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 178.92,
    change24h: 8.45,
    changePercent24h: 4.95,
    volume24h: 3800000000,
    marketCap: 78000000000,
    icon: '◎',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.6234,
    change24h: 0.0234,
    changePercent24h: 3.89,
    volume24h: 890000000,
    marketCap: 22000000000,
    icon: '₳',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.5892,
    change24h: -0.0123,
    changePercent24h: -2.04,
    volume24h: 1200000000,
    marketCap: 32000000000,
    icon: '✕',
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    price: 7.89,
    change24h: 0.34,
    changePercent24h: 4.51,
    volume24h: 450000000,
    marketCap: 10500000000,
    icon: '●',
  },
];

export const generateOrderBook = (): OrderBook => {
  const basePrice = 67432.18;
  const bids: OrderBook['bids'] = [];
  const asks: OrderBook['asks'] = [];

  for (let i = 0; i < 12; i++) {
    const bidPrice = basePrice - (i + 1) * (Math.random() * 10 + 5);
    const askPrice = basePrice + (i + 1) * (Math.random() * 10 + 5);
    const bidAmount = Math.random() * 2 + 0.1;
    const askAmount = Math.random() * 2 + 0.1;

    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: bidPrice * bidAmount,
    });

    asks.push({
      price: askPrice,
      amount: askAmount,
      total: askPrice * askAmount,
    });
  }

  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
    spread: asks[0].price - bids[0].price,
    spreadPercent: ((asks[0].price - bids[0].price) / basePrice) * 100,
  };
};

export const generateChartData = (days: number = 30): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let basePrice = 62000;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 100;

  for (let i = 100; i >= 0; i--) {
    const time = now - i * interval;
    const volatility = Math.random() * 1000 - 500;
    
    const open = basePrice + volatility;
    const close = open + (Math.random() * 800 - 400);
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    
    basePrice = close;

    data.push({
      time: Math.floor(time / 1000),
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000000 + 500000000,
    });
  }

  return data;
};
