export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  holdings?: number;
  value?: number;
  icon?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  roi: number;
  roiPercent: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface Trade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M';
export type OrderType = 'market' | 'limit' | 'stop-limit';
export type OrderSide = 'buy' | 'sell';
