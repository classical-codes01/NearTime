-- ============================================================
--  NEARTIME — Supabase SQL Setup
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE
--    Stores extra user info beyond auth.users
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT,
    city          TEXT,
    account_type  TEXT DEFAULT 'customer' CHECK (account_type IN ('customer', 'business')),
    business_name TEXT,
    business_type TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON SIGNUP
--    Trigger that runs after a user signs up
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, city, account_type, business_name, business_type)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.raw_user_meta_data ->> 'phone',
        NEW.raw_user_meta_data ->> 'city',
        COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'customer'),
        NEW.raw_user_meta_data ->> 'business_name',
        NEW.raw_user_meta_data ->> 'business_type'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────
-- 3. BARBER SHOPS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.barber_shops (
    id           SERIAL PRIMARY KEY,
    owner_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    location     TEXT NOT NULL,
    city         TEXT,
    rating       NUMERIC(3,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    services     TEXT[],     -- e.g. ARRAY['haircut','beard','styling']
    prices       JSONB,      -- e.g. {"haircut": 300, "beard": 150}
    slots        TEXT[],     -- e.g. ARRAY['10:00 AM','11:30 AM']
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO public.barber_shops (name, location, city, rating, review_count, services, prices, slots)
VALUES
    ('Classic Cuts Barber Shop', 'Civil Lines, Prayagraj', 'Prayagraj', 4.8, 245,
     ARRAY['haircut','beard','styling'], '{"haircut":300,"beard":150,"styling":200}',
     ARRAY['10:00 AM','11:30 AM','02:00 PM','04:30 PM','06:00 PM']),

    ('Style Studio', 'Muttganj, Prayagraj', 'Prayagraj', 4.5, 189,
     ARRAY['haircut','beard','shave'], '{"haircut":250,"beard":120,"shave":100}',
     ARRAY['09:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM']),

    ('Gentlemen''s Lounge', 'Kamla Nagar, Prayagraj', 'Prayagraj', 4.9, 312,
     ARRAY['haircut','beard','styling','combo'], '{"haircut":350,"beard":200,"styling":250,"combo":500}',
     ARRAY['10:00 AM','12:00 PM','02:00 PM','04:00 PM','06:00 PM']),

    ('Urban Barber', 'Tagore Town, Prayagraj', 'Prayagraj', 4.6, 156,
     ARRAY['haircut','beard','shave'], '{"haircut":280,"beard":140,"shave":120}',
     ARRAY['09:30 AM','11:30 AM','01:30 PM','03:30 PM','05:30 PM']),

    ('Royal Cuts', 'Alopibagh, Prayagraj', 'Prayagraj', 4.7, 203,
     ARRAY['haircut','beard','styling','combo'], '{"haircut":320,"beard":180,"styling":220,"combo":550}',
     ARRAY['10:00 AM','11:00 AM','02:00 PM','04:00 PM','06:30 PM']),

    ('Fresh Look Salon', 'Georgetown, Prayagraj', 'Prayagraj', 4.4, 178,
     ARRAY['haircut','beard','shave'], '{"haircut":200,"beard":100,"shave":80}',
     ARRAY['10:00 AM','12:30 PM','03:00 PM','05:00 PM']);


-- ─────────────────────────────────────────
-- 4. BOOKINGS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
    id             TEXT PRIMARY KEY DEFAULT 'BOOK' || extract(epoch from now())::bigint,
    user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shop_id        INTEGER REFERENCES public.barber_shops(id) ON DELETE SET NULL,
    service        TEXT NOT NULL,
    slot           TEXT NOT NULL,
    amount         INTEGER NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status         TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed')),
    booking_date   DATE DEFAULT CURRENT_DATE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) — Important!
-- ─────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings     ENABLE ROW LEVEL SECURITY;

-- profiles: users can read their own profile; anyone can read all (for display)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- barber_shops: anyone can read; only owners can modify
CREATE POLICY "Anyone can view active shops"
    ON public.barber_shops FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can insert shops"
    ON public.barber_shops FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their shops"
    ON public.barber_shops FOR UPDATE USING (auth.uid() = owner_id);

-- bookings: users can see only their own bookings
CREATE POLICY "Users can view their bookings"
    ON public.bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
    ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their bookings"
    ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
