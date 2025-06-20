-- Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lists_cities junction table
CREATE TABLE lists_cities (
  id SERIAL PRIMARY KEY,
  list_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, city_name)
);

-- Create emaillist_tags junction table  
CREATE TABLE emaillist_tags (
  id SERIAL PRIMARY KEY,
  list_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, tag_name)
);

-- Add indexes for better performance
CREATE INDEX idx_lists_cities_list_id ON lists_cities(list_id);
CREATE INDEX idx_lists_cities_city_name ON lists_cities(city_name);
CREATE INDEX idx_emaillist_tags_list_id ON emaillist_tags(list_id);
CREATE INDEX idx_emaillist_tags_tag_name ON emaillist_tags(tag_name);

-- Add some sample data to cities table
INSERT INTO cities (name) VALUES 
  ('New York'),
  ('London'),
  ('Paris'),
  ('Tokyo'),
  ('Sydney')
ON CONFLICT (name) DO NOTHING;

-- Add some sample data to tags table
INSERT INTO tags (name) VALUES 
  ('VIP'),
  ('Newsletter'),
  ('Promotions'),
  ('Weekly'),
  ('Monthly')
ON CONFLICT (name) DO NOTHING;
