import { CryptoAsset, PortfolioSummary, OrderBook, Trade, ChartDataPoint } from '@/types/crypto';

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
    holdings: 0.5234,
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
    holdings: 2.1567,
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
    holdings: 15.8,
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
    holdings: 5000,
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
    holdings: 2500,
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
    holdings: 120,
    icon: '●',
  },
];

export const mockPortfolio: PortfolioSummary = {
  totalValue: 52847.32,
  change24h: 1234.56,
  changePercent24h: 2.39,
  roi: 12456.78,
  roiPercent: 30.85,
};

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

export const mockTrades: Trade[] = [
  {
    id: '1',
    timestamp: new Date('2024-12-28T14:32:00'),
    type: 'buy',
    asset: 'BTC',
    amount: 0.125,
    price: 67234.56,
    total: 8404.32,
    fee: 8.40,
    status: 'completed',
  },
  {
    id: '2',
    timestamp: new Date('2024-12-27T09:15:00'),
    type: 'sell',
    asset: 'ETH',
    amount: 1.5,
    price: 3489.00,
    total: 5233.50,
    fee: 5.23,
    status: 'completed',
  },
  {
    id: '3',
    timestamp: new Date('2024-12-26T18:45:00'),
    type: 'buy',
    asset: 'SOL',
    amount: 10,
    price: 172.34,
    total: 1723.40,
    fee: 1.72,
    status: 'completed',
  },
  {
    id: '4',
    timestamp: new Date('2024-12-25T11:20:00'),
    type: 'buy',
    asset: 'ADA',
    amount: 2500,
    price: 0.5892,
    total: 1473.00,
    fee: 1.47,
    status: 'completed',
  },
  {
    id: '5',
    timestamp: new Date('2024-12-24T16:00:00'),
    type: 'sell',
    asset: 'XRP',
    amount: 1000,
    price: 0.6123,
    total: 612.30,
    fee: 0.61,
    status: 'completed',
  },
];

export const generateChartData = (days: number = 30): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let basePrice = 62000;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 100;

  for (let i = 100; i >= 0; i--) {
    const time = now - i * interval;
    const volatility = Math.random() * 1000 - 500;
    const trend = (100 - i) * 50;
    
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

export const generatePortfolioHistory = (days: number = 30): { time: number; value: number }[] => {
  const data: { time: number; value: number }[] = [];
  let baseValue = 40000;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 100;

  for (let i = 100; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.45) * 1000;
    baseValue = Math.max(baseValue + change, 30000);

    data.push({
      time: Math.floor(time / 1000),
      value: baseValue,
    });
  }

  return data;
};
