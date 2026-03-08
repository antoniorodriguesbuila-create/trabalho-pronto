import { supabase } from '../lib/supabase';
import { Order, SystemSettings, User } from '../types';

export const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data as Order[];
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<Order | null> => {
  const { data, error } = await supabase.from('orders').insert([order]).select().single();
  if (error) {
    console.error('Error creating order:', error);
    return null;
  }
  return data as Order;
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }
  return true;
};

export const fetchSettings = async (): Promise<SystemSettings | null> => {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  return data as SystemSettings;
};

export const updateSettings = async (settings: SystemSettings): Promise<boolean> => {
  const { error } = await supabase.from('settings').upsert([{ id: 1, ...settings }]);
  if (error) {
    console.error('Error updating settings:', error);
    return false;
  }
  return true;
};

export const uploadProof = async (file: File): Promise<string | null> => {
  const fileName = `${Math.random().toString(36).substring(2)}-${file.name}`;
  const { data, error } = await supabase.storage.from('proofs').upload(fileName, file);
  if (error) {
    console.error('Error uploading proof:', error);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from('proofs').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
};
