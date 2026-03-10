import { supabase } from '../lib/supabase';
import { Order, SystemSettings, User, GeneratedPaper } from '../types';

// Auth & Profiles
export const signUp = async (email: string, password: string, name: string): Promise<{ user: User | null; error?: string; requireEmailConfirmation?: boolean }> => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Error signing up:', authError);
    return { user: null, error: authError.message };
  }

  if (!authData.user) {
    return { user: null, error: 'Erro desconhecido ao criar conta.' };
  }

  // Check if email confirmation is required
  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    return { user: null, error: 'Este email já está em uso.' };
  }

  const role = email === 'bu.ila@hotmail.com' ? 'admin' : 'client';
  
  const { data: profileData, error: profileError } = await supabase.from('profiles').insert([
    { id: authData.user.id, name, email, role, balance: 500 }
  ]).select().single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // If the profile creation fails, it might be because the user already exists
    // or because RLS policies are preventing it (e.g., if email confirmation is required)
    // We'll assume email confirmation is required if the user was created but profile wasn't
    return { user: null, requireEmailConfirmation: true };
  }

  return { user: profileData as User };
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error('Error signing in:', authError);
    return null;
  }

  const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  return profileData as User;
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  
  if (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.auth.updateUser({
    password: password
  });
  
  if (error) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return profileData as User | null;
};

// Papers
export const savePaper = async (userId: string, paper: GeneratedPaper, isUnlocked: boolean): Promise<boolean> => {
  const { error } = await supabase.from('papers').insert([{
    user_id: userId,
    title: paper.title,
    content: paper.content,
    request: paper.request,
    is_unlocked: isUnlocked
  }]);

  if (error) {
    console.error('Error saving paper:', error);
    return false;
  }
  return true;
};

export const fetchUserPapers = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase.from('papers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
  return data;
};

export const unlockPaper = async (title: string, userId: string): Promise<boolean> => {
  const { error } = await supabase.from('papers').update({ is_unlocked: true }).eq('title', title).eq('user_id', userId);
  if (error) {
    console.error('Error unlocking paper:', error);
    return false;
  }
  return true;
};

// Orders
export const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data as Order[];
};

export const createOrder = async (order: Omit<Order, 'id'> & { user_id: string }): Promise<Order | null> => {
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

// Settings
export const fetchSettings = async (): Promise<SystemSettings | null> => {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  return data as SystemSettings;
};

export const updateSettings = async (settings: SystemSettings): Promise<boolean> => {
  const { error } = await supabase.from('settings').update({ 
    price: settings.price, 
    bankAccounts: settings.bankAccounts 
  }).eq('id', 1);
  
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
