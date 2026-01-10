-- Create wallets table for user balances
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brl_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create crypto_holdings table for user crypto balances
CREATE TABLE public.crypto_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create transactions table for deposits, withdrawals, buys, sells
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'buy', 'sell')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  amount DECIMAL(18, 2) NOT NULL,
  fee DECIMAL(18, 2) NOT NULL DEFAULT 0,
  crypto_symbol TEXT,
  crypto_amount DECIMAL(18, 8),
  crypto_price DECIMAL(18, 2),
  payment_id TEXT,
  payment_method TEXT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet" 
ON public.wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for crypto_holdings
CREATE POLICY "Users can view their own holdings" 
ON public.crypto_holdings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own holdings" 
ON public.crypto_holdings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
ON public.crypto_holdings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crypto_holdings_updated_at
BEFORE UPDATE ON public.crypto_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;