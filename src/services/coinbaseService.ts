import { supabase } from '@/integrations/supabase/client';
import { CryptoAsset } from '@/types/crypto';

interface CoinbasePrice {
  price: number;
  currency: string;
  volume24h?: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  name?: string;
  displayName?: string;
}

interface PricesResponse {
  success: boolean;
  data: {
    prices: Record<string, CoinbasePrice>;
    products: Array<{
      id: string;
      symbol: string;
      displayName: string;
      name: string;
      minSize: string;
      maxSize: string;
      status: string;
    }>;
  };
  error?: string;
}

interface LegacyPricesResponse {
  success: boolean;
  data: Record<string, CoinbasePrice>;
  error?: string;
}

// Extended crypto metadata with icons
const CRYPTO_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
  ADA: '₳',
  XRP: '✕',
  DOT: '●',
  AVAX: '🔺',
  MATIC: '⬡',
  LINK: '⬡',
  UNI: '🦄',
  DOGE: '🐕',
  SHIB: '🐕',
  LTC: 'Ł',
  BCH: '₿',
  ATOM: '⚛',
  ALGO: 'Ⓐ',
  FIL: '⨍',
  NEAR: 'Ⓝ',
  APT: '🌟',
  ARB: '🔵',
  OP: '🔴',
  SUI: '💧',
  SEI: '🌊',
  INJ: '💉',
  TIA: '✨',
  PEPE: '🐸',
  WIF: '🐕',
  BONK: '🦴',
  RENDER: '🎨',
  FET: '🤖',
  RNDR: '🎨',
  GRT: '📊',
  IMX: 'Ⓧ',
  SAND: '🏖',
  MANA: '🌐',
  AXS: '∞',
  ENS: '🏷',
  LDO: '💧',
  AAVE: '👻',
  MKR: 'Ⓜ',
  CRV: '⟁',
  SNX: '⟠',
  COMP: '©',
  YFI: '🔷',
  SUSHI: '🍣',
  '1INCH': '🦄',
  BAL: '⚖',
  ZRX: '⬡',
  KNC: '🔷',
  STORJ: '☁',
  NMR: '🔮',
  OGN: '⭕',
  REN: '🔁',
  BAND: '🎵',
  UMA: '🔺',
  NU: '🔐',
  SPELL: '✨',
  CVX: '⟁',
  FXS: '🔷',
  RPL: '🚀',
  SSV: '🔷',
  BLUR: '🟣',
  MAGIC: '✨',
  GMX: '📈',
  STX: '📦',
  HNT: '📡',
  IOTX: '🌐',
  CTSI: '🎯',
  API3: '🔗',
  CELO: '🟢',
  XTZ: 'ꜩ',
  EGLD: '⚡',
  ROSE: '🌹',
  FLOW: '🌊',
  MINA: '🔒',
  KAVA: '🔥',
  ZEC: 'ⓩ',
  DASH: '💨',
  ETC: 'Ξ',
  EOS: 'ε',
  NEO: 'Ⓝ',
  QTUM: 'Ⓠ',
  ZEN: '🔷',
  XLM: '✦',
  TRX: '⟁',
  VET: '✔',
  HBAR: 'ℏ',
  ICP: '∞',
  THETA: 'Θ',
  FTM: '👻',
  ONE: '🔷',
  WAVES: '🌊',
  XMR: 'ɱ',
  USDT: '₮',
  USDC: '$',
  DAI: '◈',
  BUSD: '🅱',
  TUSD: '₮',
  USDP: '$',
  GUSD: 'Ⓖ',
  FRAX: '⨍',
  LUSD: 'Ⓛ',
  SUSD: '⟠',
  DEFAULT: '●',
};

// Store previous prices for calculating changes
let previousPrices: Record<string, { price: number; timestamp: number }> = {};

// Calculate 24h change from open price
const calculate24hChange = (currentPrice: number, open24h: number | null): number => {
  if (!open24h || open24h === 0) {
    // Fallback to simulated change
    return 0;
  }
  return ((currentPrice - open24h) / open24h) * 100;
};

// Estimate market cap based on circulating supply approximations
const CIRCULATING_SUPPLY: Record<string, number> = {
  BTC: 19600000,
  ETH: 120000000,
  SOL: 430000000,
  ADA: 35000000000,
  XRP: 55000000000,
  DOT: 1400000000,
  AVAX: 360000000,
  MATIC: 10000000000,
  LINK: 600000000,
  UNI: 1000000000,
  DOGE: 142000000000,
  SHIB: 589000000000000,
  LTC: 74000000,
  BCH: 19600000,
  ATOM: 380000000,
  ALGO: 8200000000,
  FIL: 500000000,
  NEAR: 1100000000,
  APT: 400000000,
  ARB: 3300000000,
  OP: 1100000000,
  SUI: 2700000000,
  SEI: 3800000000,
  INJ: 90000000,
  TIA: 200000000,
  PEPE: 420690000000000,
  WIF: 1000000000,
  BONK: 68000000000000,
  ICP: 500000000,
  HBAR: 35000000000,
  VET: 73000000000,
  XLM: 28000000000,
  TRX: 90000000000,
  FTM: 2800000000,
  AAVE: 15000000,
  MKR: 1000000,
  CRV: 1300000000,
  GRT: 9500000000,
  STX: 1400000000,
  HNT: 160000000,
  XTZ: 950000000,
  FLOW: 1500000000,
  ZEC: 16000000,
  DASH: 11000000,
  ETC: 144000000,
  EOS: 1100000000,
  XMR: 18400000,
};

// Estimate market cap from price and known/estimated supply
const estimateMarketCap = (symbol: string, price: number): number => {
  const supply = CIRCULATING_SUPPLY[symbol];
  if (supply) {
    return price * supply;
  }
  // Default estimation based on typical altcoin supply
  return price * 100000000;
};

export const fetchLivePrices = async (): Promise<CryptoAsset[]> => {
  try {
    // Try to fetch all prices first
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-all-prices' },
    });

    if (error) {
      console.error('Error fetching all prices:', error);
      throw error;
    }

    const response = data as PricesResponse;
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch prices:', response.error);
      throw new Error(response.error || 'Failed to fetch prices');
    }

    const { prices, products } = response.data;
    const now = Date.now();
    
    const assets: CryptoAsset[] = Object.entries(prices).map(([symbol, priceData]) => {
      const currentPrice = priceData.price;
      const product = products?.find(p => p.symbol === symbol);
      
      // Calculate 24h change from actual data
      let changePercent24h = 0;
      if (priceData.open24h) {
        changePercent24h = calculate24hChange(currentPrice, priceData.open24h);
      }
      
      const change24h = currentPrice * (changePercent24h / 100);
      
      // Update previous prices
      previousPrices[symbol] = { price: currentPrice, timestamp: now };
      
      const icon = CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT;
      const name = priceData.name || product?.name || symbol;
      const volume24h = priceData.volume24h || 0;
      const marketCap = estimateMarketCap(symbol, currentPrice);
      
      return {
        id: symbol.toLowerCase(),
        symbol,
        name,
        price: currentPrice,
        change24h,
        changePercent24h,
        volume24h,
        marketCap,
        icon,
      };
    });

    // Sort by market cap
    return assets.sort((a, b) => b.marketCap - a.marketCap);
  } catch (error) {
    console.error('Error in fetchLivePrices:', error);
    
    // Fallback to legacy endpoint
    return fetchLegacyPrices();
  }
};

// Legacy function for backward compatibility
const fetchLegacyPrices = async (): Promise<CryptoAsset[]> => {
  const { data, error } = await supabase.functions.invoke('coinbase-api', {
    body: { action: 'get-prices' },
  });

  if (error) {
    throw error;
  }

  const response = data as LegacyPricesResponse;
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch prices');
  }

  const now = Date.now();
  
  const assets: CryptoAsset[] = Object.entries(response.data).map(([symbol, priceData]) => {
    const currentPrice = priceData.price;
    
    let changePercent24h = 0;
    if (priceData.open24h) {
      changePercent24h = calculate24hChange(currentPrice, priceData.open24h);
    }
    
    const change24h = currentPrice * (changePercent24h / 100);
    previousPrices[symbol] = { price: currentPrice, timestamp: now };
    
    const icon = CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT;
    const volume24h = priceData.volume24h || 0;
    const marketCap = estimateMarketCap(symbol, currentPrice);
    
    return {
      id: symbol.toLowerCase(),
      symbol,
      name: priceData.name || symbol,
      price: currentPrice,
      change24h,
      changePercent24h,
      volume24h,
      marketCap,
      icon,
    };
  });

  return assets.sort((a, b) => b.marketCap - a.marketCap);
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

export const fetchAvailableProducts = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-products' },
    });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchAvailableProducts:', error);
    throw error;
  }
};
