import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINBASE_API_KEY_ID = Deno.env.get('COINBASE_API_KEY_ID');
const COINBASE_PRIVATE_KEY = Deno.env.get('COINBASE_PRIVATE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const FEE_PERCENTAGE = 0.029; // 2.90% fee

async function getCryptoPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-BRL/spot`);
    const data = await response.json();
    return parseFloat(data.data.amount);
  } catch (error) {
    console.error('Error fetching price:', error);
    throw new Error('Failed to fetch crypto price');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, symbol, amount, cryptoAmount } = await req.json();

    // Get user's wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Failed to fetch wallet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create wallet if it doesn't exist
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: user.id, brl_balance: 0 })
        .select()
        .single();
      
      if (createError) {
        return new Response(JSON.stringify({ error: 'Failed to create wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      wallet = newWallet;
    }

    if (action === 'buy') {
      // Get current price
      const price = await getCryptoPrice(symbol);
      
      // Calculate total cost with fee
      const fee = parseFloat((amount * FEE_PERCENTAGE).toFixed(2));
      const totalCost = amount + fee;
      const cryptoToBuy = amount / price;

      // Check if user has enough balance
      if (parseFloat(wallet.brl_balance) < totalCost) {
        return new Response(JSON.stringify({ 
          error: 'Saldo insuficiente',
          required: totalCost,
          available: wallet.brl_balance,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.brl_balance) - totalCost;
      await supabase
        .from('wallets')
        .update({ brl_balance: newBalance })
        .eq('user_id', user.id);

      // Update or create crypto holding
      const { data: holding } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .single();

      if (holding) {
        const newAmount = parseFloat(holding.amount) + cryptoToBuy;
        const newAvgPrice = ((parseFloat(holding.amount) * parseFloat(holding.avg_buy_price)) + (cryptoToBuy * price)) / newAmount;
        
        await supabase
          .from('crypto_holdings')
          .update({ amount: newAmount, avg_buy_price: newAvgPrice })
          .eq('id', holding.id);
      } else {
        await supabase
          .from('crypto_holdings')
          .insert({
            user_id: user.id,
            symbol: symbol,
            amount: cryptoToBuy,
            avg_buy_price: price,
          });
      }

      // Create transaction record
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'buy',
          status: 'completed',
          amount: amount,
          fee: fee,
          crypto_symbol: symbol,
          crypto_amount: cryptoToBuy,
          crypto_price: price,
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        success: true,
        transaction,
        crypto_bought: cryptoToBuy,
        price,
        fee,
        new_balance: newBalance,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sell') {
      // Get current price
      const price = await getCryptoPrice(symbol);
      
      // Get user's holding
      const { data: holding, error: holdingError } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .single();

      if (holdingError || !holding || parseFloat(holding.amount) < cryptoAmount) {
        return new Response(JSON.stringify({ 
          error: 'Saldo de crypto insuficiente',
          available: holding?.amount || 0,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate sale value with fee
      const saleValue = cryptoAmount * price;
      const fee = parseFloat((saleValue * FEE_PERCENTAGE).toFixed(2));
      const netValue = saleValue - fee;

      // Update wallet balance
      const newBalance = parseFloat(wallet.brl_balance) + netValue;
      await supabase
        .from('wallets')
        .update({ brl_balance: newBalance })
        .eq('user_id', user.id);

      // Update crypto holding
      const newCryptoAmount = parseFloat(holding.amount) - cryptoAmount;
      if (newCryptoAmount <= 0) {
        await supabase
          .from('crypto_holdings')
          .delete()
          .eq('id', holding.id);
      } else {
        await supabase
          .from('crypto_holdings')
          .update({ amount: newCryptoAmount })
          .eq('id', holding.id);
      }

      // Create transaction record
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'sell',
          status: 'completed',
          amount: saleValue,
          fee: fee,
          crypto_symbol: symbol,
          crypto_amount: cryptoAmount,
          crypto_price: price,
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        success: true,
        transaction,
        crypto_sold: cryptoAmount,
        price,
        fee,
        net_value: netValue,
        new_balance: newBalance,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_price') {
      const price = await getCryptoPrice(symbol);
      return new Response(JSON.stringify({ symbol, price }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
