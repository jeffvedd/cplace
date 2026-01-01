import { create } from 'zustand';
import { CryptoAsset, OrderBook, Trade, PortfolioSummary } from '@/types/crypto';
import { mockAssets, mockPortfolio, generateOrderBook, mockTrades } from '@/data/mockData';

interface CryptoState {
  assets: CryptoAsset[];
  selectedAsset: CryptoAsset | null;
  orderBook: OrderBook;
  trades: Trade[];
  portfolio: PortfolioSummary;
  isLoading: boolean;
  theme: 'light' | 'dark';
  setAssets: (assets: CryptoAsset[]) => void;
  setSelectedAsset: (asset: CryptoAsset) => void;
  setPortfolio: (portfolio: PortfolioSummary) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  refreshOrderBook: () => void;
  updatePortfolioFromAssets: () => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  assets: mockAssets,
  selectedAsset: mockAssets[0],
  orderBook: generateOrderBook(),
  trades: mockTrades,
  portfolio: mockPortfolio,
  isLoading: false,
  theme: 'dark',

  setAssets: (assets) => {
    set({ assets });
    // Update selected asset if it exists in new assets
    const currentSelected = get().selectedAsset;
    if (currentSelected) {
      const updated = assets.find(a => a.symbol === currentSelected.symbol);
      if (updated) {
        set({ selectedAsset: updated });
      }
    }
    // Recalculate portfolio
    get().updatePortfolioFromAssets();
  },

  setSelectedAsset: (asset) => {
    set({ selectedAsset: asset, orderBook: generateOrderBook() });
  },

  setPortfolio: (portfolio) => {
    set({ portfolio });
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

  updatePortfolioFromAssets: () => {
    const assets = get().assets;
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.holdings || 0) * asset.price;
    }, 0);
    
    const change24h = assets.reduce((sum, asset) => {
      return sum + (asset.holdings || 0) * asset.change24h;
    }, 0);
    
    const changePercent24h = totalValue > 0 ? (change24h / totalValue) * 100 : 0;
    
    set({
      portfolio: {
        totalValue,
        change24h,
        changePercent24h,
        roi: totalValue * 0.3, // Placeholder ROI calculation
        roiPercent: 30,
      },
    });
  },
}));
