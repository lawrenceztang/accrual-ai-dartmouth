import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ProgramMapping {
  id: string
  program_name: string
  debit_entity: string
  debit_org: string
  debit_funding: string
  debit_activity: string
  debit_subactivity: string
  debit_natural_class: string
  credit_entity: string
  credit_org: string
  credit_funding: string
  credit_activity: string
  credit_subactivity: string
  credit_natural_class: string
  created_at: string
  updated_at: string
}

export interface StripeTransaction {
  id: string
  stripe_payment_id: string
  program_name: string
  amount: number
  currency: string
  status: string
  created_at: string
  processed: boolean
  batch_id?: string
}

export interface JournalEntry {
  id: string
  transaction_id: string
  entity: string
  org: string
  funding: string
  activity: string
  subactivity: string
  natural_class: string
  amount: number
  entry_type: 'debit' | 'credit'
  batch_id?: string
  created_at: string
}

export interface JournalEntryBatch {
  id: string
  batch_name: string
  status: 'draft' | 'completed'
  total_transactions: number
  total_amount: number
  created_at: string
  completed_at?: string
}