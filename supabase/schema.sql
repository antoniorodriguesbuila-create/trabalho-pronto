-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create papers table
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  request JSONB NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "proofUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  price NUMERIC NOT NULL,
  "bankAccounts" JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Insert default settings if not exists
INSERT INTO settings (id, price, "bankAccounts")
VALUES (
  1, 
  1000, 
  '[{"id": "1", "bankName": "Banco BAI", "iban": "AO06 0000 0000 0000 0000 0", "accountHolder": "Trabalho Pronto Lda"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all for demo purposes, adjust for production)
CREATE POLICY "Allow all operations for profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations for papers" ON papers FOR ALL USING (true);
CREATE POLICY "Allow all operations for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for settings" ON settings FOR ALL USING (true);

-- Storage policies
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proofs');
CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
