-- Create program_mappings table
CREATE TABLE program_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name VARCHAR(255) UNIQUE NOT NULL,
  entity VARCHAR(100) NOT NULL,
  org VARCHAR(100) NOT NULL,
  funding VARCHAR(100) NOT NULL,
  activity VARCHAR(100) NOT NULL,
  subactivity VARCHAR(100) NOT NULL,
  natural_class VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stripe_transactions table
CREATE TABLE stripe_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Create journal_entries table
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES stripe_transactions(id),
  entity VARCHAR(100) NOT NULL,
  org VARCHAR(100) NOT NULL,
  funding VARCHAR(100) NOT NULL,
  activity VARCHAR(100) NOT NULL,
  subactivity VARCHAR(100) NOT NULL,
  natural_class VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  oracle_journal_id VARCHAR(255),
  uploaded_to_oracle BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_program_mappings_program_name ON program_mappings(program_name);
CREATE INDEX idx_stripe_transactions_stripe_payment_id ON stripe_transactions(stripe_payment_id);
CREATE INDEX idx_stripe_transactions_processed ON stripe_transactions(processed);
CREATE INDEX idx_journal_entries_transaction_id ON journal_entries(transaction_id);
CREATE INDEX idx_journal_entries_uploaded_to_oracle ON journal_entries(uploaded_to_oracle);

-- Enable Row Level Security
ALTER TABLE program_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
CREATE POLICY "Allow all operations on program_mappings" ON program_mappings FOR ALL USING (true);
CREATE POLICY "Allow all operations on stripe_transactions" ON stripe_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on journal_entries" ON journal_entries FOR ALL USING (true);