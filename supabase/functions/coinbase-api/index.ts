import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Coinbase CDP API authentication
const signRequest = async (
  method: string,
  path: string,
  body: string = ''
): Promise<{ signature: string; timestamp: string }> => {
  const privateKeyPem = Deno.env.get('COINBASE_PRIVATE_KEY');
  const apiKeyId = Deno.env.get('COINBASE_API_KEY_ID');
  
  if (!privateKeyPem || !apiKeyId) {
    throw new Error('Missing Coinbase API credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}${method}${path}${body}`;
  
  // Parse PEM and create signature
  const pemContents = privateKeyPem
    .replace(/\\n/g, '\n')
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(message)
  );

  const signature = arrayBufferToBase64(signatureBuffer);
  
  return { signature, timestamp };
};

const makeRequest = async (method: string, endpoint: string, body?: object) => {
  const apiKeyId = Deno.env.get('COINBASE_API_KEY_ID');
  const baseUrl = 'https://api.coinbase.com';
  const path = endpoint;
  const bodyStr = body ? JSON.stringify(body) : '';
  
  const { signature, timestamp } = await signRequest(method, path, bodyStr);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'CB-ACCESS-KEY': apiKeyId!,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-VERSION': '2024-01-01',
  };

  console.log(`Making ${method} request to ${baseUrl}${path}`);
  
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Coinbase API error: ${response.status} - ${errorText}`);
    throw new Error(`Coinbase API error: ${response.status}`);
  }

  return response.json();
};

// Fetch prices from public Coinbase API (no auth needed)
const fetchPrices = async () => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT'];
  const prices: Record<string, any> = {};
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
      const data = await response.json();
      
      // Get 24h price change
      const buyResponse = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/buy`);
      const buyData = await buyResponse.json();
      
      prices[symbol] = {
        price: parseFloat(data.data.amount),
        currency: data.data.currency,
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
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
    const data = await response.json();
    return data.data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`Processing action: ${action}`);

    let result;

    switch (action) {
      case 'get-prices':
        result = await fetchPrices();
        break;
        
      case 'get-exchange-rates':
        result = await fetchExchangeRates();
        break;
        
      case 'get-accounts':
        // Authenticated endpoint - get user accounts
        result = await makeRequest('GET', '/v2/accounts');
        break;
        
      case 'get-account':
        // Get specific account
        result = await makeRequest('GET', `/v2/accounts/${params.accountId}`);
        break;
        
      case 'get-transactions':
        // Get account transactions
        result = await makeRequest('GET', `/v2/accounts/${params.accountId}/transactions`);
        break;
        
      case 'create-order':
        // Place an order (buy/sell)
        result = await makeRequest('POST', `/v2/accounts/${params.accountId}/${params.type}s`, {
          amount: params.amount,
          currency: params.currency,
          payment_method: params.paymentMethodId,
        });
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
