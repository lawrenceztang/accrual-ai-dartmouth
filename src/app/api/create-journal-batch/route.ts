import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapTransactionToJournalEntry, createJournalEntries } from '@/lib/journal-mapper'

export async function POST() {
  try {
    // Get all pending transactions (not yet processed into journal entries)
    const { data: pendingTransactions, error: transactionError } = await supabase
      .from('stripe_transactions')
      .select('*')
      .eq('processed', false)

    if (transactionError) {
      throw transactionError
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No pending transactions to create journal entry'
      })
    }

    // Check if there's an existing draft batch
    const { data: existingDraftBatch, error: draftBatchError } = await supabase
      .from('journal_entry_batches')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let batch: any

    if (existingDraftBatch && !draftBatchError) {
      // Add to existing draft batch
      const newTotalTransactions = existingDraftBatch.total_transactions + pendingTransactions.length
      const newTotalAmount = existingDraftBatch.total_amount + pendingTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      const { data: updatedBatch, error: updateError } = await supabase
        .from('journal_entry_batches')
        .update({
          total_transactions: newTotalTransactions,
          total_amount: newTotalAmount,
          batch_name: `Journal Entry ${new Date().toISOString().split('T')[0]} - ${newTotalTransactions} transactions`
        })
        .eq('id', existingDraftBatch.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
      
      batch = updatedBatch
    } else {
      // Create new journal entry batch
      const totalTransactions = pendingTransactions.length
      const totalAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0)
      const batchName = `Journal Entry ${new Date().toISOString().split('T')[0]} - ${totalTransactions} transactions`
      
      const { data: newBatch, error: batchError } = await supabase
        .from('journal_entry_batches')
        .insert([{
          batch_name: batchName,
          status: 'draft',
          total_transactions: totalTransactions,
          total_amount: totalAmount
        }])
        .select()
        .single()

      if (batchError) {
        throw batchError
      }
      
      batch = newBatch
    }

    // Process each transaction and create journal entries
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const transaction of pendingTransactions) {
      try {
        // Map transaction to journal entry data (now always returns data, even with blank fields)
        const journalData = await mapTransactionToJournalEntry(transaction)

        // Create journal entries (debit and credit)
        const journalEntries = await createJournalEntries(transaction.id, journalData)
        
        // Update journal entries with batch ID
        await supabase
          .from('journal_entries')
          .update({ batch_id: batch.id })
          .in('id', journalEntries.map(e => e.id))

        // Mark transaction as processed
        await supabase
          .from('stripe_transactions')
          .update({ 
            batch_id: batch.id,
            processed: true 
          })
          .eq('id', transaction.id)

        successCount++
      } catch (error) {
        errorCount++
        errors.push(`Error processing transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batch_name: batch.batch_name,
        total_transactions: batch.total_transactions,
        total_amount: batch.total_amount
      },
      processed: successCount,
      errors: errorCount,
      errorDetails: errors,
      message: `Created journal entry batch with ${successCount} transactions.`
    })
  } catch (error) {
    console.error('Error creating journal entry batch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create journal entry batch' },
      { status: 500 }
    )
  }
}