import { supabase } from '@/integrations/supabase/client';

export interface WalletAccount {
  uuid: string;
  name: string;
  currency: string;
  balance: number;
  hold: number;
  available: number;
  usd_value: number;
  type: string;
}

export interface WalletData {
  accounts: WalletAccount[];
  total_usd_value: number;
}

export interface AssetROI {
  symbol: string;
  invested: number;
  current_value: number;
  profit_loss: number;
  roi_percent: number;
  quantity: number;
  current_price: number;
}

export interface ROIData {
  total_invested: number;
  current_value: number;
  profit_loss: number;
  roi_percent: number;
  assets: AssetROI[];
}

export interface OrderPreview {
  product_id: string;
  side: 'BUY' | 'SELL';
  quote_amount?: number;
  base_amount?: number;
  estimated_fee: number;
  net_amount: number;
  estimated_quantity?: number;
  current_price: number;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  error?: string;
}

export const fetchWallet = async (): Promise<WalletData> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-accounts' },
    });

    if (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch wallet');
    }

    return data.data as WalletData;
  } catch (error) {
    console.error('Error in fetchWallet:', error);
    throw error;
  }
};

export const fetchROI = async (): Promise<ROIData> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'get-roi' },
    });

    if (error) {
      console.error('Error fetching ROI:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch ROI');
    }

    return data.data as ROIData;
  } catch (error) {
    console.error('Error in fetchROI:', error);
    throw error;
  }
};

export const getOrderPreview = async (
  productId: string,
  side: 'BUY' | 'SELL',
  amount: string
): Promise<OrderPreview> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'order-preview', productId, side, amount },
    });

    if (error) {
      console.error('Error getting order preview:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get order preview');
    }

    return data.data as OrderPreview;
  } catch (error) {
    console.error('Error in getOrderPreview:', error);
    throw error;
  }
};

export const placeBuyOrder = async (
  productId: string,
  funds: string
): Promise<OrderResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'buy', productId, funds },
    });

    if (error) {
      console.error('Error placing buy order:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to place order' };
    }

    return { 
      success: true, 
      order_id: data.data?.order_id || data.data?.success_response?.order_id 
    };
  } catch (error) {
    console.error('Error in placeBuyOrder:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const placeSellOrder = async (
  productId: string,
  size: string
): Promise<OrderResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-api', {
      body: { action: 'sell', productId, size },
    });

    if (error) {
      console.error('Error placing sell order:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to place order' };
    }

    return { 
      success: true, 
      order_id: data.data?.order_id || data.data?.success_response?.order_id 
    };
  } catch (error) {
    console.error('Error in placeSellOrder:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
