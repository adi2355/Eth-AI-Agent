/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `address` (text, unique) - Ethereum address
      - `role` (text) - User role (basic/advanced)
      - `created_at` (timestamp)
      - `last_login` (timestamp)
    
    - `queries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `query` (text)
      - `response` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'basic',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  query text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own queries"
  ON queries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own queries"
  ON queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());