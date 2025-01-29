/*
  # Initial Schema Setup for Founder-Developer Platform

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to Supabase auth.users
    - `ideas`
      - Stores founder project ideas
      - Contains project details, equity info, and requirements
    - `applications`
      - Stores developer applications to ideas
      - Links developers to ideas they're interested in

  2. Security
    - Enable RLS on all tables
    - Set up policies for reading and writing data
*/ 

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text,
  full_name text,
  avatar_url text,
  github_url text,
  whatsapp_number text,
  is_founder boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  equity_share decimal NOT NULL,
  requirements text NOT NULL,
  additional_benefits text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) NOT NULL,
  developer_id uuid REFERENCES profiles(id) NOT NULL,
  pitch text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, developer_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Ideas are viewable by everyone"
  ON ideas FOR SELECT
  USING (true);

CREATE POLICY "Founders can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = founder_id);

-- Applications policies
CREATE POLICY "Applications are viewable by idea founder and applicant"
  ON applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT founder_id FROM ideas WHERE id = idea_id
      UNION
      SELECT developer_id FROM applications WHERE id = applications.id
    )
  );

CREATE POLICY "Developers can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Founders can update application status"
  ON applications FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT founder_id FROM ideas WHERE id = idea_id
    )
  );