import { createClient } from '@supabase/supabase-js'

// Configuration
const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000';
const SUPABASE_URL = import.meta.env.VITE_REACT_APP_SUPABASE_URL || 'https://iaqyggcjvrprevburnjy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Interface for product data
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  size: string;
  barcode?: string;
  sku?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for scan result
interface ScanResult {
  product: Product;
  confidence: number;
  barcode?: string;
  timestamp: string;
}

/**
 * Lookup product by barcode
 * @param barcode The barcode to look up
 * @returns Product information or null if not found
 */
export const lookupByBarcode = async (barcode: string): Promise<ScanResult | null> => {
  try {
    // First try to find in Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) throw error;
    if (!product) return null;

    return {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        size: product.size,
        barcode: product.barcode,
        sku: product.sku,
        image_url: product.image_url,
        description: product.description,
        created_at: product.created_at,
        updated_at: product.updated_at
      },
      confidence: 0.99, // High confidence for barcode scans
      barcode: barcode,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return null;
  }
};

/**
 * Recognize product from image using YOLO model
 * @param file Image file to process
 * @returns Detected product information or null if not recognized
 */
export const recognizeImage = async (file: File): Promise<ScanResult | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Send to FastAPI backend for processing
    const response = await fetch(`${API_URL}/detect-item`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error from server: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.product) {
      throw new Error('No product detected in the image');
    }

    return {
      product: {
        id: result.product.id,
        name: result.product.name,
        brand: result.product.brand,
        category: result.product.category,
        price: result.product.price,
        size: result.product.size,
        barcode: result.product.barcode,
        sku: result.product.sku,
        image_url: result.product.image_url,
        description: result.product.description,
      },
      confidence: result.confidence || 0.85,
      timestamp: result.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error recognizing image:', error);
    throw error;
  }
};

/**
 * Recognize product using AI vision (Smart Vision Scan)
 * @param file Image file to process
 * @param userId User ID for tracking
 * @returns Detected product information or null if not recognized
 */
export const recognizeWithAIVision = async (file: File, userId: string): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    
    // Send to FastAPI backend for AI vision processing
    const response = await fetch(`${API_URL}/detect-vision`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error from server: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status !== "success") {
      throw new Error(result.message || 'No product detected in the image');
    }

    return result;
  } catch (error) {
    console.error('Error recognizing with AI vision:', error);
    throw error;
  }
};

/**
 * Save scan data to Supabase
 * @param scanData Scan data to save
 * @returns Saved scan data or error
 */
export const saveScanToSupabase = async (scanData: {
  user_id: string;
  product_id: string;
  confidence: number;
  qty: number;
  created_at: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        user_id: scanData.user_id,
        product_id: scanData.product_id,
        confidence: scanData.confidence,
        qty: scanData.qty,
        created_at: scanData.created_at,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error saving scan to Supabase:', error);
    return { data: null, error };
  }
};

/**
 * Update cart in Supabase
 * @param cartData Cart data to update
 * @returns Updated cart data or error
 */
export const updateCartInSupabase = async (cartData: {
  user_id: string;
  product_id: string;
  qty: number;
  total_price: number;
}) => {
  try {
    // First check if the item already exists in the cart
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', cartData.user_id)
      .eq('product_id', cartData.product_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let result;
    
    if (existingItem) {
      // Update existing cart item
      const { data, error } = await supabase
        .from('cart')
        .update({
          qty: existingItem.qty + cartData.qty,
          total_price: existingItem.total_price + cartData.total_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new cart item
      const { data, error } = await supabase
        .from('cart')
        .insert([{
          user_id: cartData.user_id,
          product_id: cartData.product_id,
          qty: cartData.qty,
          total_price: cartData.total_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating cart in Supabase:', error);
    return { data: null, error };
  }
};

/**
 * Send user feedback for AI training
 * @param feedbackData Feedback data to save
 * @returns Saved feedback data or error
 */
export const sendUserFeedback = async (feedbackData: {
  user_id: string;
  image_url: string;
  label: string;
  user_feedback: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from('training_data')
      .insert([{
        user_id: feedbackData.user_id,
        image_url: feedbackData.image_url,
        label: feedbackData.label,
        user_feedback: feedbackData.user_feedback,
        added_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error saving feedback to Supabase:', error);
    return { data: null, error };
  }
};

/**
 * Record a purchase in the purchase_history table
 * @param purchaseData Purchase data to record
 * @returns Recorded purchase data or error
 */
export const recordPurchase = async (purchaseData: {
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('purchase_history')
      .insert([{
        user_id: purchaseData.user_id,
        product_id: purchaseData.product_id,
        quantity: purchaseData.quantity,
        total_price: purchaseData.total_price,
        purchased_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error recording purchase:', error);
    return { data: null, error };
  }
};