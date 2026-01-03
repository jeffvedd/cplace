import { useState, useEffect, useCallback } from 'react';
import { fetchLivePrices } from '@/services/coinbaseService';
import { CryptoAsset } from '@/types/crypto';
import { useCryptoStore } from '@/store/cryptoStore';

const REFRESH_INTERVAL = 15000; // 15 seconds to avoid rate limits

export const useLivePrices = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { setAssets } = useCryptoStore();

  const refreshPrices = useCallback(async () => {
    try {
      setError(null);
      const liveAssets = await fetchLivePrices();
      
      setAssets(liveAssets);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(message);
      console.error('Error refreshing prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setAssets]);

  useEffect(() => {
    refreshPrices();
    
    const interval = setInterval(refreshPrices, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [refreshPrices]);

  return {
    isLoading,
    error,
    lastUpdated,
    refreshPrices,
  };
};
