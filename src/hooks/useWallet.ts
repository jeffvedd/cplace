import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Wallet {
  id: string;
  user_id: string;
  brl_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CryptoHolding {
  id: string;
  user_id: string;
  symbol: string;
  amount: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  fee: number;
  crypto_symbol?: string;
  crypto_amount?: number;
  crypto_price?: number;
  payment_id?: string;
  payment_method?: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const { user, session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', walletError);
      } else if (walletData) {
        setWallet(walletData as Wallet);
      }

      // Fetch holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id);

      if (holdingsError) {
        console.error('Error fetching holdings:', holdingsError);
      } else {
        setHoldings((holdingsData || []) as CryptoHolding[]);
      }

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) {
        console.error('Error fetching transactions:', txError);
      } else {
        setTransactions((txData || []) as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Subscribe to realtime updates for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallet]);

  const createPixDeposit = async (amount: number) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const response = await supabase.functions.invoke('mercadopago-pix', {
        body: { action: 'create_pix', amount },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      await fetchWallet();
      return response.data;
    } catch (error: any) {
      console.error('Error creating PIX deposit:', error);
      toast.error('Erro ao criar depósito PIX');
      return null;
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    if (!session?.access_token) return null;

    try {
      const response = await supabase.functions.invoke('mercadopago-pix', {
        body: { action: 'check_payment', transactionId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      await fetchWallet();
      return response.data;
    } catch (error: any) {
      console.error('Error checking payment:', error);
      return null;
    }
  };

  const buyCrypto = async (symbol: string, amount: number) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const response = await supabase.functions.invoke('crypto-trade', {
        body: { action: 'buy', symbol, amount },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        toast.error(response.data.error);
        return null;
      }

      await fetchWallet();
      toast.success(`Compra realizada! ${response.data.crypto_bought.toFixed(8)} ${symbol}`);
      return response.data;
    } catch (error: any) {
      console.error('Error buying crypto:', error);
      toast.error('Erro ao comprar crypto');
      return null;
    }
  };

  const sellCrypto = async (symbol: string, cryptoAmount: number) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const response = await supabase.functions.invoke('crypto-trade', {
        body: { action: 'sell', symbol, cryptoAmount },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        toast.error(response.data.error);
        return null;
      }

      await fetchWallet();
      toast.success(`Venda realizada! R$ ${response.data.net_value.toFixed(2)}`);
      return response.data;
    } catch (error: any) {
      console.error('Error selling crypto:', error);
      toast.error('Erro ao vender crypto');
      return null;
    }
  };

  const getCryptoPrice = async (symbol: string) => {
    try {
      const response = await supabase.functions.invoke('crypto-trade', {
        body: { action: 'get_price', symbol },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.price;
    } catch (error: any) {
      console.error('Error getting price:', error);
      return null;
    }
  };

  return {
    wallet,
    holdings,
    transactions,
    loading,
    createPixDeposit,
    checkPaymentStatus,
    buyCrypto,
    sellCrypto,
    getCryptoPrice,
    refetch: fetchWallet,
  };
}
