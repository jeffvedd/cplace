import { supabase } from '@/integrations/supabase/client';
import { CryptoAsset } from '@/types/crypto';

interface CoinbasePrice {
  price: number;
  currency: string;
}

interface PricesResponse {
  success: boolean;
  data: Record<string, CoinbasePrice>;
  error?: string;
}

const CRYPTO_METADATA: Record<string, { name: string; icon: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  SOL: { name: 'Solana', icon: '◎' },
  ADA: { name: 'Cardano', icon: '₳' },
  XRP: { name: 'Ripple', icon: '✕' },
  DOT: { name: 'Polkadot', icon: '●' },
  AVAX: { name: 'Avalanche', icon: '🔺' },
  MATIC: { name: 'Polygon', icon: '⬡' },
  LINK: { name: 'Chainlink', icon: '⬡' },
  UNI: { name: 'Uniswap', icon: '🦄' },
};

// Store previous prices for calculating changes
let previousPrices: Record<string, { price: number; timestamp: number }> = {};

// Simulated 24h change based on price volatility
const simulateChange24h = (symbol: string, currentPrice: number): number => {
  // Use a seeded random based on symbol and day for consistency
  const today = new Date().toDateString();
  const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1) + today.length;
  const pseudoRandom = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
  
  // Generate change between -8% and +8%
  return (pseudoRandom - 0.5) * 16;
};

// Simulated market data
const simulateMarketData = (symbol: string, price: number) => {
  const seed = symbol.charCodeAt(0) * symbol.charCodeAt(symbol.length - 1);
  
  // Market cap estimation based on typical crypto rankings
  const marketCapMultipliers: Record<string, number> = {
    BTC: 19500000, // ~19.5M BTC in circulation
    ETH: 120000000, // ~120M ETH
    SOL: 430000000,
    ADA: 35000000000,
    XRP: 55000000000,
    DOT: 1400000000,
    AVAX: 360000000,
    MATIC: 10000000000,
    LINK: 600000000,
    UNI: 1000000000,
  };
  
  const multiplier = marketCapMultipliers[symbol] || 100000000;
  const marketCap = price * multiplier;
  
  // Volume is typically 1-5% of market cap
  const volumePercent = 0.01 + (Math.abs(Math.sin(seed)) * 0.04);
  const volume24h = marketCap * volumePercent;
  
  return { marketCap, volume24h };
};

export const fetchLivePrices = async (): Promise<CryptoAsset[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-prices' },
    });

    if (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }

    const response = data as PricesResponse;
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch prices:', response.error);
      throw new Error(response.error || 'Failed to fetch prices');
    }

    const now = Date.now();
    
    const assets: CryptoAsset[] = Object.entries(response.data).map(([symbol, priceData]) => {
      const currentPrice = priceData.price;
      const changePercent24h = simulateChange24h(symbol, currentPrice);
      const change24h = currentPrice * (changePercent24h / 100);
      
      // Update previous prices
      previousPrices[symbol] = { price: currentPrice, timestamp: now };
      
      const metadata = CRYPTO_METADATA[symbol] || { name: symbol, icon: symbol[0] };
      const { marketCap, volume24h } = simulateMarketData(symbol, currentPrice);
      
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: metadata.name,
        price: currentPrice,
        change24h,
        changePercent24h,
        volume24h,
        marketCap,
        icon: metadata.icon,
      };
    });

    // Sort by market cap
    return assets.sort((a, b) => b.marketCap - a.marketCap);
  } catch (error) {
    console.error('Error in fetchLivePrices:', error);
    throw error;
  }
};

export const fetchExchangeRates = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-exchange-rates' },
    });

    if (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchExchangeRates:', error);
    throw error;
  }
};
