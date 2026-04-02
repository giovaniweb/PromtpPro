-- PromptPro SaaS — Database Migration
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  credits_balance INTEGER DEFAULT 3,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "User updates own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. GENERATIONS (user history)
-- ============================================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  style_id TEXT,
  prompt_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role insert generations"
  ON generations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. STYLES (admin-created + usage tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  prompt_en TEXT DEFAULT '',
  room TEXT DEFAULT 'editorial',
  usage_count INTEGER DEFAULT 0,
  is_admin_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read styles"
  ON styles FOR SELECT
  USING (true);

CREATE POLICY "Service role manage styles"
  ON styles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. CREDIT_PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE credit_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read credit_plans"
  ON credit_plans FOR SELECT
  USING (true);

INSERT INTO credit_plans (name, credits, price_brl, description) VALUES
  ('Básico',   50,  19.90, '50 gerações — ideal para testar'),
  ('Pro',      200, 59.90, '200 gerações — uso regular'),
  ('Business', 500, 119.90, '500 gerações — criadores e marcas')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. STORAGE BUCKET: style-thumbnails
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('style-thumbnails', 'style-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read style-thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'style-thumbnails');

-- ============================================================
-- 6. HELPER FUNCTION: increment style usage_count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_style_usage(p_style_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO styles (id, name, thumbnail_url, usage_count)
  VALUES (p_style_id, p_style_id, '', 1)
  ON CONFLICT (id) DO UPDATE SET usage_count = styles.usage_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
