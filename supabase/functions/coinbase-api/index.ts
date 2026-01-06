import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - max 10 requests per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100;

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Parse and import the Coinbase private key
const importPrivateKey = async (pemKey: string): Promise<CryptoKey> => {
  // Clean the PEM key - remove headers and whitespace
  let keyContent = pemKey
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
    .replace(/-----END EC PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\s/g, '')
    .trim();
  
  console.log('Key content length:', keyContent.length);
  
  // Decode base64
  const binaryDer = Uint8Array.from(atob(keyContent), c => c.charCodeAt(0));
  console.log('Binary DER length:', binaryDer.length);
  
  // Try PKCS#8 format first (-----BEGIN PRIVATE KEY-----)
  try {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    console.log('Successfully imported as PKCS#8');
    return key;
  } catch (e) {
    console.log('PKCS#8 import failed, trying SEC1 conversion:', e);
  }
  
  // SEC1 format (-----BEGIN EC PRIVATE KEY-----) needs conversion
  // Parse SEC1 ASN.1 structure to extract the 32-byte private key
  // SEC1 ECPrivateKey ::= SEQUENCE {
  //   version INTEGER { ecPrivkeyVer1(1) },
  //   privateKey OCTET STRING,
  //   parameters [0] ECParameters {{ NamedCurve }} OPTIONAL,
  //   publicKey [1] BIT STRING OPTIONAL
  // }
  
  let privateKeyBytes: Uint8Array | null = null;
  
  // Look for the private key octet string (04 20 followed by 32 bytes)
  for (let i = 0; i < binaryDer.length - 34; i++) {
    if (binaryDer[i] === 0x04 && binaryDer[i + 1] === 0x20) {
      privateKeyBytes = binaryDer.slice(i + 2, i + 34);
      console.log('Found 32-byte private key at offset', i);
      break;
    }
  }
  
  if (!privateKeyBytes) {
    // Try looking for a 32-byte sequence differently
    // Sometimes the key is just after 02 01 01 04 20
    for (let i = 0; i < binaryDer.length - 37; i++) {
      if (binaryDer[i] === 0x02 && binaryDer[i+1] === 0x01 && binaryDer[i+2] === 0x01 && 
          binaryDer[i+3] === 0x04 && binaryDer[i+4] === 0x20) {
        privateKeyBytes = binaryDer.slice(i + 5, i + 37);
        console.log('Found private key with version marker at offset', i);
        break;
      }
    }
  }
  
  if (!privateKeyBytes) {
    throw new Error('Could not extract private key from SEC1 format. Key length: ' + binaryDer.length);
  }
  
  // Convert 32-byte raw key to JWK format for import
  const privateKeyBase64Url = btoa(String.fromCharCode(...privateKeyBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // For P-256, we need x and y coordinates of public key, or we can try raw import
  // Let's build a minimal JWK with just the private key (d parameter)
  // We'll use a placeholder for x,y - the sign operation only needs d
  
  // Actually, let's try building proper PKCS#8 from the extracted private key
  const pkcs8Der = new Uint8Array([
    0x30, 0x41, // SEQUENCE, length 65
    0x02, 0x01, 0x00, // INTEGER version = 0
    0x30, 0x13, // SEQUENCE AlgorithmIdentifier
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey (1.2.840.10045.2.1)
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID prime256v1/P-256 (1.2.840.10045.3.1.7)
    0x04, 0x27, // OCTET STRING, length 39
    0x30, 0x25, // SEQUENCE, length 37
    0x02, 0x01, 0x01, // INTEGER version = 1
    0x04, 0x20, // OCTET STRING, length 32
    ...privateKeyBytes // The 32-byte private key
  ]);
  
  try {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pkcs8Der,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    console.log('Successfully imported converted SEC1 key');
    return key;
  } catch (e) {
    console.log('Converted PKCS#8 import failed:', e);
    throw new Error('Failed to import private key: ' + e);
  }
};

// Generate JWT token for Coinbase Advanced Trade API
const generateJWT = async (apiKeyId: string, privateKey: string, requestMethod: string, requestPath: string): Promise<string> => {
  const uri = `${requestMethod} api.coinbase.com${requestPath}`;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 120; // 2 minutes expiry

  const header = {
    alg: 'ES256',
    typ: 'JWT',
    kid: apiKeyId,
    nonce: crypto.randomUUID(),
  };

  const payload = {
    sub: apiKeyId,
    iss: 'coinbase-cloud',
    nbf: now,
    exp: exp,
    uri: uri,
  };

  const encodeBase64Url = (data: string): string => {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = encodeBase64Url(JSON.stringify(header));
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw format (r || s)
  const signatureArray = new Uint8Array(signature);
  let signatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
};

// Make authenticated request to Coinbase Advanced Trade API
const authenticatedRequest = async (
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<Response> => {
  const apiKeyId = Deno.env.get('COINBASE_API_KEY_ID');
  const privateKey = Deno.env.get('COINBASE_PRIVATE_KEY');

  if (!apiKeyId || !privateKey) {
    throw new Error('Coinbase API credentials not configured');
  }

  const jwt = await generateJWT(apiKeyId, privateKey, method, path);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  await waitForRateLimit();
  return fetch(`https://api.coinbase.com${path}`, options);
};

// Fetch prices from public Coinbase API (no auth needed)
const fetchPrices = async () => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI'];
  const prices: Record<string, { price: number; currency: string }> = {};
  
  for (const symbol of symbols) {
    try {
      await waitForRateLimit();
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
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
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
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return null;
  }
};

// Get user accounts/wallets
const fetchAccounts = async () => {
  console.log('Fetching accounts from Coinbase Advanced Trade API...');
  
  const response = await authenticatedRequest('GET', '/api/v3/brokerage/accounts');
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error fetching accounts:', response.status, errorText);
    throw new Error(`Failed to fetch accounts: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Accounts fetched successfully:', data.accounts?.length || 0, 'accounts');
  
  // Get current prices for USD conversion
  const prices = await fetchPrices();
  
  const accounts = (data.accounts || []).map((account: any) => {
    const balance = parseFloat(account.available_balance?.value || '0');
    const currency = account.currency;
    let usdValue = 0;
    
    if (currency === 'USD') {
      usdValue = balance;
    } else if (prices[currency]) {
      usdValue = balance * prices[currency].price;
    }
    
    return {
      uuid: account.uuid,
      name: account.name,
      currency: currency,
      balance: balance,
      hold: parseFloat(account.hold?.value || '0'),
      available: balance,
      usd_value: usdValue,
      type: account.type,
    };
  }).filter((account: any) => account.balance > 0 || account.currency === 'USD');
  
  const totalUsdValue = accounts.reduce((sum: number, acc: any) => sum + acc.usd_value, 0);
  
  return {
    accounts,
    total_usd_value: totalUsdValue,
  };
};

// Get transaction history for ROI calculation
const fetchTransactions = async () => {
  console.log('Fetching transaction history...');
  
  const response = await authenticatedRequest('GET', '/api/v3/brokerage/orders/historical/fills?limit=100');
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error fetching transactions:', response.status, errorText);
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  const data = await response.json();
  return data.fills || [];
};

// Calculate ROI based on transaction history
const calculateROI = async () => {
  console.log('Calculating ROI...');
  
  const [accountsData, fills] = await Promise.all([
    fetchAccounts(),
    fetchTransactions(),
  ]);
  
  const prices = await fetchPrices();
  
  // Calculate invested amounts per asset
  const investments: Record<string, { invested: number; quantity: number }> = {};
  
  for (const fill of fills) {
    const productId = fill.product_id;
    const [baseCurrency] = productId.split('-');
    const size = parseFloat(fill.size || '0');
    const price = parseFloat(fill.price || '0');
    const fee = parseFloat(fill.commission || '0');
    const side = fill.side;
    
    if (!investments[baseCurrency]) {
      investments[baseCurrency] = { invested: 0, quantity: 0 };
    }
    
    if (side === 'BUY') {
      investments[baseCurrency].invested += (size * price) + fee;
      investments[baseCurrency].quantity += size;
    } else if (side === 'SELL') {
      // For sells, reduce the invested amount proportionally
      const avgCost = investments[baseCurrency].quantity > 0 
        ? investments[baseCurrency].invested / investments[baseCurrency].quantity 
        : 0;
      investments[baseCurrency].invested -= size * avgCost;
      investments[baseCurrency].quantity -= size;
    }
  }
  
  // Calculate current values and ROI per asset
  const assets: Array<{
    symbol: string;
    invested: number;
    current_value: number;
    profit_loss: number;
    roi_percent: number;
    quantity: number;
    current_price: number;
  }> = [];
  
  let totalInvested = 0;
  let totalCurrentValue = 0;
  
  for (const account of accountsData.accounts) {
    const currency = account.currency;
    if (currency === 'USD') continue;
    
    const investment = investments[currency] || { invested: 0, quantity: 0 };
    const currentValue = account.usd_value;
    const profitLoss = currentValue - investment.invested;
    const roiPercent = investment.invested > 0 
      ? ((currentValue - investment.invested) / investment.invested) * 100 
      : 0;
    
    if (account.balance > 0) {
      assets.push({
        symbol: currency,
        invested: investment.invested,
        current_value: currentValue,
        profit_loss: profitLoss,
        roi_percent: roiPercent,
        quantity: account.balance,
        current_price: prices[currency]?.price || 0,
      });
      
      totalInvested += investment.invested;
      totalCurrentValue += currentValue;
    }
  }
  
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalRoiPercent = totalInvested > 0 
    ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
    : 0;
  
  return {
    total_invested: totalInvested,
    current_value: totalCurrentValue,
    profit_loss: totalProfitLoss,
    roi_percent: totalRoiPercent,
    assets,
  };
};

// Place a buy order
const placeBuyOrder = async (productId: string, funds: string) => {
  console.log(`Placing buy order: ${productId}, funds: ${funds}`);
  
  // Validate inputs
  const fundsNum = parseFloat(funds);
  if (isNaN(fundsNum) || fundsNum <= 0) {
    throw new Error('Invalid funds amount');
  }
  
  if (fundsNum < 1) {
    throw new Error('Minimum order amount is $1');
  }
  
  const orderBody = {
    client_order_id: crypto.randomUUID(),
    product_id: productId,
    side: 'BUY',
    order_configuration: {
      market_market_ioc: {
        quote_size: funds,
      },
    },
  };
  
  const response = await authenticatedRequest('POST', '/api/v3/brokerage/orders', orderBody);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error placing buy order:', response.status, errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || errorData.error || 'Failed to place order');
    } catch {
      throw new Error(`Failed to place order: ${response.status}`);
    }
  }
  
  const data = await response.json();
  console.log('Buy order placed successfully:', data);
  return data;
};

// Place a sell order
const placeSellOrder = async (productId: string, size: string) => {
  console.log(`Placing sell order: ${productId}, size: ${size}`);
  
  // Validate inputs
  const sizeNum = parseFloat(size);
  if (isNaN(sizeNum) || sizeNum <= 0) {
    throw new Error('Invalid size amount');
  }
  
  const orderBody = {
    client_order_id: crypto.randomUUID(),
    product_id: productId,
    side: 'SELL',
    order_configuration: {
      market_market_ioc: {
        base_size: size,
      },
    },
  };
  
  const response = await authenticatedRequest('POST', '/api/v3/brokerage/orders', orderBody);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error placing sell order:', response.status, errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || errorData.error || 'Failed to place order');
    } catch {
      throw new Error(`Failed to place order: ${response.status}`);
    }
  }
  
  const data = await response.json();
  console.log('Sell order placed successfully:', data);
  return data;
};

// Get order preview (estimate fees and final amount)
const getOrderPreview = async (productId: string, side: string, amount: string) => {
  console.log(`Getting order preview: ${productId}, side: ${side}, amount: ${amount}`);
  
  const prices = await fetchPrices();
  const [baseCurrency] = productId.split('-');
  const currentPrice = prices[baseCurrency]?.price || 0;
  
  // Coinbase fee is approximately 0.5% for market orders
  const feeRate = 0.005;
  const amountNum = parseFloat(amount);
  
  if (side === 'BUY') {
    const fee = amountNum * feeRate;
    const netAmount = amountNum - fee;
    const estimatedQuantity = netAmount / currentPrice;
    
    return {
      product_id: productId,
      side: 'BUY',
      quote_amount: amountNum,
      estimated_fee: fee,
      net_amount: netAmount,
      estimated_quantity: estimatedQuantity,
      current_price: currentPrice,
    };
  } else {
    const quoteAmount = amountNum * currentPrice;
    const fee = quoteAmount * feeRate;
    const netAmount = quoteAmount - fee;
    
    return {
      product_id: productId,
      side: 'SELL',
      base_amount: amountNum,
      estimated_fee: fee,
      net_amount: netAmount,
      quote_amount: quoteAmount,
      current_price: currentPrice,
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, productId, funds, size, side, amount } = await req.json();
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
        
      case 'get-accounts':
        result = await fetchAccounts();
        break;
        
      case 'get-roi':
        result = await calculateROI();
        break;
        
      case 'buy':
        if (!productId || !funds) {
          throw new Error('Missing productId or funds');
        }
        result = await placeBuyOrder(productId, funds);
        break;
        
      case 'sell':
        if (!productId || !size) {
          throw new Error('Missing productId or size');
        }
        result = await placeSellOrder(productId, size);
        break;
        
      case 'order-preview':
        if (!productId || !side || !amount) {
          throw new Error('Missing productId, side, or amount');
        }
        result = await getOrderPreview(productId, side, amount);
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
