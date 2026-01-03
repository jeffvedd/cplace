import { create } from 'zustand';
import { CryptoAsset, OrderBook } from '@/types/crypto';
import { mockAssets, generateOrderBook } from '@/data/mockData';

interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  topGainer: { symbol: string; change: number } | null;
  topLoser: { symbol: string; change: number } | null;
}

interface CryptoState {
  assets: CryptoAsset[];
  selectedAsset: CryptoAsset | null;
  orderBook: OrderBook;
  marketStats: MarketStats;
  isLoading: boolean;
  theme: 'light' | 'dark';
  watchlist: string[];
  setAssets: (assets: CryptoAsset[]) => void;
  setSelectedAsset: (asset: CryptoAsset) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  refreshOrderBook: () => void;
  updateMarketStats: () => void;
  toggleWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  assets: mockAssets.map(a => ({ ...a, holdings: undefined, value: undefined })),
  selectedAsset: mockAssets[0],
  orderBook: generateOrderBook(),
  marketStats: {
    totalMarketCap: 0,
    totalVolume24h: 0,
    btcDominance: 0,
    topGainer: null,
    topLoser: null,
  },
  isLoading: false,
  theme: 'dark',
  watchlist: ['BTC', 'ETH', 'SOL'],

  setAssets: (assets) => {
    // Remove any holdings/value data - this is a quote-only app
    const cleanAssets = assets.map(a => ({
      ...a,
      holdings: undefined,
      value: undefined,
    }));
    
    set({ assets: cleanAssets });
    
    // Update selected asset if it exists in new assets
    const currentSelected = get().selectedAsset;
    if (currentSelected) {
      const updated = cleanAssets.find(a => a.symbol === currentSelected.symbol);
      if (updated) {
        set({ selectedAsset: updated });
      }
    }
    
    // Recalculate market stats
    get().updateMarketStats();
  },

  setSelectedAsset: (asset) => {
    set({ selectedAsset: asset, orderBook: generateOrderBook() });
  },

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  refreshOrderBook: () => {
    set({ orderBook: generateOrderBook() });
  },

  updateMarketStats: () => {
    const assets = get().assets;
    
    const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCap, 0);
    const totalVolume24h = assets.reduce((sum, asset) => sum + asset.volume24h, 0);
    
    const btc = assets.find(a => a.symbol === 'BTC');
    const btcDominance = btc ? (btc.marketCap / totalMarketCap) * 100 : 0;
    
    const sorted = [...assets].sort((a, b) => b.changePercent24h - a.changePercent24h);
    const topGainer = sorted.length > 0 
      ? { symbol: sorted[0].symbol, change: sorted[0].changePercent24h }
      : null;
    const topLoser = sorted.length > 0 
      ? { symbol: sorted[sorted.length - 1].symbol, change: sorted[sorted.length - 1].changePercent24h }
      : null;
    
    set({
      marketStats: {
        totalMarketCap,
        totalVolume24h,
        btcDominance,
        topGainer,
        topLoser,
      },
    });
  },

  toggleWatchlist: (symbol: string) => {
    const watchlist = get().watchlist;
    if (watchlist.includes(symbol)) {
      set({ watchlist: watchlist.filter(s => s !== symbol) });
    } else {
      set({ watchlist: [...watchlist, symbol] });
    }
  },

  isInWatchlist: (symbol: string) => {
    return get().watchlist.includes(symbol);
  },
}));
