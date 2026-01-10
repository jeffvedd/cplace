import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    const { action, amount, transactionId } = await req.json();

    if (action === 'create_pix') {
      // Calculate fee (2.90%)
      const fee = parseFloat((amount * 0.029).toFixed(2));
      const totalAmount = parseFloat((amount + fee).toFixed(2));

      // Create PIX payment in Mercado Pago
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${user.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: totalAmount,
          description: 'Depósito Crypto Place',
          payment_method_id: 'pix',
          payer: {
            email: user.email,
          },
        }),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago error:', mpData);
        return new Response(JSON.stringify({ error: 'Failed to create PIX payment', details: mpData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          status: 'pending',
          amount: amount,
          fee: fee,
          payment_id: mpData.id.toString(),
          payment_method: 'pix',
          pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
          pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        })
        .select()
        .single();

      if (txError) {
        console.error('Transaction insert error:', txError);
        return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        transaction,
        pix: {
          qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
          expiration_date: mpData.date_of_expiration,
        },
        total_amount: totalAmount,
        fee: fee,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check_payment') {
      // Get transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single();

      if (txError || !transaction) {
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (transaction.status === 'completed') {
        return new Response(JSON.stringify({ status: 'completed', transaction }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check payment status in Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${transaction.payment_id}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });

      const mpData = await mpResponse.json();

      if (mpData.status === 'approved') {
        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transactionId);

        // Update wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ brl_balance: parseFloat(wallet.brl_balance) + parseFloat(transaction.amount) })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('wallets')
            .insert({ user_id: user.id, brl_balance: transaction.amount });
        }

        return new Response(JSON.stringify({ status: 'completed', transaction: { ...transaction, status: 'completed' } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ status: mpData.status, transaction }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
