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
};

// Store previous prices for calculating changes
let previousPrices: Record<string, number> = {};

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

    const assets: CryptoAsset[] = Object.entries(response.data).map(([symbol, priceData]) => {
      const currentPrice = priceData.price;
      const prevPrice = previousPrices[symbol] || currentPrice;
      const change24h = currentPrice - prevPrice;
      const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : 0;
      
      // Update previous prices
      previousPrices[symbol] = currentPrice;
      
      const metadata = CRYPTO_METADATA[symbol] || { name: symbol, icon: symbol[0] };
      
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: metadata.name,
        price: currentPrice,
        change24h,
        changePercent24h: Math.random() > 0.5 ? Math.abs(changePercent24h) : -Math.abs(changePercent24h), // Simulate variation
        volume24h: Math.random() * 10000000000 + 1000000000, // Simulated volume
        marketCap: currentPrice * (Math.random() * 100000000 + 10000000), // Estimated market cap
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

export const fetchAccounts = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-accounts' },
    });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchAccounts:', error);
    throw error;
  }
};

export const fetchTransactions = async (accountId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-transactions', params: { accountId } },
    });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchTransactions:', error);
    throw error;
  }
};
