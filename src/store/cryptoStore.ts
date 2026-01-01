import { create } from 'zustand';
import { CryptoAsset, OrderBook, Trade } from '@/types/crypto';
import { mockAssets, mockPortfolio, generateOrderBook, mockTrades } from '@/data/mockData';

interface CryptoState {
  assets: CryptoAsset[];
  selectedAsset: CryptoAsset | null;
  orderBook: OrderBook;
  trades: Trade[];
  portfolio: typeof mockPortfolio;
  isLoading: boolean;
  theme: 'light' | 'dark';
  setSelectedAsset: (asset: CryptoAsset) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  refreshOrderBook: () => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  assets: mockAssets,
  selectedAsset: mockAssets[0],
  orderBook: generateOrderBook(),
  trades: mockTrades,
  portfolio: mockPortfolio,
  isLoading: false,
  theme: 'dark',

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
}));
