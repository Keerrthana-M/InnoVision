-- Supabase Schema for AI Smart Vision Scan System

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- products: load BigBasket dataset rows into this table
create table products (
  id uuid primary key default gen_random_uuid(),
  product_id text unique,
  sku text,
  barcode text,
  product_name text,
  brand text,
  category text,
  price numeric,
  size text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- scans: each detection attempt
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid references products(id),
  product_name text,
  confidence numeric,
  image_url text,
  status text,
  created_at timestamptz default now()
);

-- training_data: user-supplied images for retraining
create table training_data (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  label text,
  user_id uuid,
  added_at timestamptz default now()
);

-- model_metrics: track model performance over time
create table model_metrics (
  id uuid primary key default gen_random_uuid(),
  model_name text,
  version text,
  map50 numeric,
  map95 numeric,
  accuracy numeric,
  trained_at timestamptz default now()
);

-- cart: user shopping cart
create table cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  qty int,
  total_price numeric,
  updated_at timestamptz default now()
);

-- purchase_history: user purchase history
create table purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  items jsonb,
  total_amount numeric,
  purchased_at timestamptz default now()
);

-- Add indexes for better performance
create index idx_scans_user_id on scans(user_id);
create index idx_scans_product_id on scans(product_id);
create index idx_products_name on products(product_name);
create index idx_products_category on products(category);
create index idx_cart_user_id on cart(user_id);
create index idx_training_data_user_id on training_data(user_id);