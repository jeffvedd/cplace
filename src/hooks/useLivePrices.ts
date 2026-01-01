import { useState, useEffect, useCallback } from 'react';
import { fetchLivePrices } from '@/services/coinbaseService';
import { CryptoAsset } from '@/types/crypto';
import { useCryptoStore } from '@/store/cryptoStore';
import { toast } from '@/hooks/use-toast';

const REFRESH_INTERVAL = 10000; // 10 seconds

export const useLivePrices = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { assets, setAssets } = useCryptoStore();

  const refreshPrices = useCallback(async () => {
    try {
      const liveAssets = await fetchLivePrices();
      
      // Merge live prices with existing holdings data
      const mergedAssets = liveAssets.map(liveAsset => {
        const existingAsset = assets.find(a => a.symbol === liveAsset.symbol);
        return {
          ...liveAsset,
          holdings: existingAsset?.holdings || 0,
          value: existingAsset?.holdings ? existingAsset.holdings * liveAsset.price : 0,
        };
      });
      
      setAssets(mergedAssets);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(message);
      console.error('Error refreshing prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assets, setAssets]);

  useEffect(() => {
    refreshPrices();
    
    const interval = setInterval(refreshPrices, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isLoading,
    error,
    lastUpdated,
    refreshPrices,
  };
};
