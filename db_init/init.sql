-- Create the 'urls' table if it doesn't already exist
CREATE TABLE IF NOT EXISTS urls (
    short_url VARCHAR(10) PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);