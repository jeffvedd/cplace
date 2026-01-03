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

// Fetch prices from public Coinbase API (no auth needed)
const fetchPrices = async () => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI'];
  const prices: Record<string, any> = {};
  
  for (const symbol of symbols) {
    try {
      await waitForRateLimit();
      
      // Get spot price
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
    const { action } = await req.json();
    console.log(`Processing action: ${action}`);

    let result;

    switch (action) {
      case 'get-prices':
        result = await fetchPrices();
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
