import { NextResponse } from 'next/server'
import { fetchStripeTransactions } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const transactions = await fetchStripeTransactions(100)
    
    let syncedCount = 0
    
    for (const transaction of transactions) {
      // Check if transaction already exists
      const { data: existingTransaction } = await supabase
        .from('stripe_transactions')
        .select('id')
        .eq('stripe_payment_id', transaction.id)
        .single()

      if (existingTransaction) {
        continue // Skip if already exists
      }
      
      // Insert transaction - all new transactions start as processed=false
      const { error } = await supabase
        .from('stripe_transactions')
        .insert({
          stripe_payment_id: transaction.id,
          program_name: transaction.program_name,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          processed: false, // All transactions start as unprocessed
        })
      
      if (error) {
        console.error('Error inserting transaction:', error)
        throw error
      }
      
      syncedCount++
    }
    
    const message = `Synced ${syncedCount} new transactions. All are ready for journal entry creation.`
    
    return NextResponse.json({ 
      success: true, 
      message,
      synced: syncedCount
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}