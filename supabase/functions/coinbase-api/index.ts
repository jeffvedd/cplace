import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - max 10 requests per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Fetch all available trading products from Coinbase
const fetchAllProducts = async () => {
  try {
    await waitForRateLimit();
    // Get all trading pairs from Coinbase Exchange API
    const response = await fetch('https://api.exchange.coinbase.com/products');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const products = await response.json();
    
    // Filter only USD trading pairs and extract unique base currencies
    const usdProducts = products.filter((p: any) => 
      p.quote_currency === 'USD' && 
      p.status === 'online' &&
      !p.trading_disabled
    );
    
    return usdProducts.map((p: any) => ({
      id: p.id,
      symbol: p.base_currency,
      displayName: p.base_display_symbol || p.base_currency,
      name: p.base_name || p.base_currency,
      minSize: p.base_min_size,
      maxSize: p.base_max_size,
      status: p.status,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};

// Fetch prices for all available cryptos
const fetchAllPrices = async () => {
  try {
    // First get all available products
    const products = await fetchAllProducts();
    if (!products) {
      throw new Error('Failed to fetch products');
    }

    const prices: Record<string, any> = {};
    const symbols = products.map((p: any) => p.symbol);
    
    // Use batch approach - fetch stats in parallel batches
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (symbol: string) => {
        try {
          await waitForRateLimit();
          
          // Get 24h stats which includes open, high, low, volume
          const productId = `${symbol}-USD`;
          const [statsResponse, tickerResponse] = await Promise.all([
            fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`),
            fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`)
          ]);
          
          const product = products.find((p: any) => p.symbol === symbol);
          
          if (statsResponse.ok && tickerResponse.ok) {
            const statsData = await statsResponse.json();
            const tickerData = await tickerResponse.json();
            
            const currentPrice = parseFloat(tickerData.price);
            const open24h = parseFloat(statsData.open);
            const high24h = parseFloat(statsData.high);
            const low24h = parseFloat(statsData.low);
            const volume24h = parseFloat(statsData.volume) * currentPrice;
            
            // Calculate percentage change
            const changePercent24h = open24h > 0 
              ? ((currentPrice - open24h) / open24h) * 100 
              : 0;
            
            prices[symbol] = {
              price: currentPrice,
              currency: 'USD',
              volume24h: volume24h,
              open24h: open24h,
              high24h: high24h,
              low24h: low24h,
              changePercent24h: changePercent24h,
              name: product?.name || symbol,
              displayName: product?.displayName || symbol,
            };
          } else if (tickerResponse.ok) {
            // Fallback to ticker only
            const tickerData = await tickerResponse.json();
            prices[symbol] = {
              price: parseFloat(tickerData.price),
              currency: 'USD',
              volume24h: parseFloat(tickerData.volume) * parseFloat(tickerData.price),
              open24h: null,
              high24h: null,
              low24h: null,
              changePercent24h: 0,
              name: product?.name || symbol,
              displayName: product?.displayName || symbol,
            };
          } else {
            // Fallback to spot price if both fail
            const spotResponse = await fetch(
              `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
            );
            if (spotResponse.ok) {
              const spotData = await spotResponse.json();
              prices[symbol] = {
                price: parseFloat(spotData.data.amount),
                currency: 'USD',
                changePercent24h: 0,
                name: product?.name || symbol,
                displayName: product?.displayName || symbol,
              };
            }
          }
        } catch (error) {
          console.warn(`Error fetching price for ${symbol}:`, error);
        }
      }));
    }
    
    return { prices, products };
  } catch (error) {
    console.error('Error fetching all prices:', error);
    throw error;
  }
};

// Fetch prices for specific symbols (legacy support)
const fetchPrices = async (symbols?: string[]) => {
  const targetSymbols = symbols || ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI'];
  const prices: Record<string, any> = {};
  
  for (const symbol of targetSymbols) {
    try {
      await waitForRateLimit();
      
      // Try ticker first for more data
      const tickerResponse = await fetch(
        `https://api.exchange.coinbase.com/products/${symbol}-USD/ticker`
      );
      
      if (tickerResponse.ok) {
        const tickerData = await tickerResponse.json();
        prices[symbol] = {
          price: parseFloat(tickerData.price),
          currency: 'USD',
          volume24h: parseFloat(tickerData.volume) * parseFloat(tickerData.price),
          open24h: parseFloat(tickerData.open_24h) || null,
          high24h: parseFloat(tickerData.high_24h) || null,
          low24h: parseFloat(tickerData.low_24h) || null,
        };
        continue;
      }
      
      // Fallback to spot price
      const spotResponse = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
      if (!spotResponse.ok) {
        console.warn(`Failed to fetch spot price for ${symbol}: ${spotResponse.status}`);
        continue;
      }
      const spotData = await spotResponse.json();
      
      prices[symbol] = {
        price: parseFloat(spotData.data.amount),
        currency: spotData.data.currency,
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    }
  }
  
  return prices;
};

// Fetch exchange rates for multiple currencies
const fetchExchangeRates = async () => {
  try {
    await waitForRateLimit();
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data.data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};

// Get available currencies
const fetchCurrencies = async () => {
  try {
    await waitForRateLimit();
    const response = await fetch('https://api.coinbase.com/v2/currencies');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols } = await req.json();
    console.log(`Processing action: ${action}`);

    let result;

    switch (action) {
      case 'get-prices':
        result = await fetchPrices(symbols);
        break;
      
      case 'get-all-prices':
        result = await fetchAllPrices();
        break;
      
      case 'get-products':
        result = await fetchAllProducts();
        break;
        
      case 'get-exchange-rates':
        result = await fetchExchangeRates();
        break;
        
      case 'get-currencies':
        result = await fetchCurrencies();
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in coinbase-api function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
