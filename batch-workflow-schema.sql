-- Create journal_entry_batches table for batch workflow
CREATE TABLE journal_entry_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'completed'
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Update journal_entries table to reference batches
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES journal_entry_batches(id);

-- Update stripe_transactions to track batch processing
ALTER TABLE stripe_transactions 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES journal_entry_batches(id),
ADD COLUMN IF NOT EXISTS in_batch BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX idx_journal_entry_batches_status ON journal_entry_batches(status);
CREATE INDEX idx_journal_entries_batch_id ON journal_entries(batch_id);
CREATE INDEX idx_stripe_transactions_batch_id ON stripe_transactions(batch_id);
CREATE INDEX idx_stripe_transactions_in_batch ON stripe_transactions(in_batch);

-- Enable Row Level Security
ALTER TABLE journal_entry_batches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on journal_entry_batches" ON journal_entry_batches FOR ALL USING (true);