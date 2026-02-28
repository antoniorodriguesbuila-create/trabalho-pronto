import { supabase } from '../lib/supabase';
import { Order, OrderStatus, GeneratedPaper, PaperRequest } from '../types';

// Helper to upload proof file to Supabase Storage
export const uploadPaymentProof = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `proofs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('payment_proofs')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do comprovativo: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('payment_proofs')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Create a new order with the generated paper
export const createOrder = async (
  userId: string,
  userName: string,
  paper: GeneratedPaper,
  amount: number,
  proofUrl: string
): Promise<Order> => {
  const dateStr = new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        user_id: userId,
        user_name: userName,
        theme: paper.title,
        date: dateStr,
        status: 'Pendente',
        amount: amount,
        proof_url: proofUrl,
        paper_content: paper.content,
        paper_request: paper.request,
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar pedido: ${error.message}`);
  }

  return {
    id: data.id,
    user: data.user_name,
    theme: data.theme,
    date: data.date,
    status: data.status as OrderStatus,
    amount: data.amount,
    proofUrl: data.proof_url,
    paperContent: data.paper_content,
    paperRequest: data.paper_request,
  };
};

// Fetch orders for admin
export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    user: row.user_name,
    theme: row.theme,
    date: row.date,
    status: row.status as OrderStatus,
    amount: row.amount,
    proofUrl: row.proof_url,
    paperContent: row.paper_content,
    paperRequest: row.paper_request,
  }));
};

// Fetch orders for a specific user
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pedidos do utilizador:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    user: row.user_name,
    theme: row.theme,
    date: row.date,
    status: row.status as OrderStatus,
    amount: row.amount,
    proofUrl: row.proof_url,
    paperContent: row.paper_content,
    paperRequest: row.paper_request,
  }));
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Erro ao atualizar estado do pedido: ${error.message}`);
  }
};
