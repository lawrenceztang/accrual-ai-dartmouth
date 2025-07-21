import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { batchId } = await request.json()

    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get the batch to verify it exists and is in draft status
    const { data: batch, error: batchError } = await supabase
      .from('journal_entry_batches')
      .select('*')
      .eq('id', batchId)
      .eq('status', 'draft')
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, message: 'Draft batch not found' },
        { status: 404 }
      )
    }

    // Delete all journal entries associated with this batch
    const { error: deleteEntriesError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('batch_id', batchId)

    if (deleteEntriesError) {
      throw deleteEntriesError
    }

    // Reset all transactions back to unprocessed
    const { error: resetTransactionsError } = await supabase
      .from('stripe_transactions')
      .update({ 
        processed: false,
        batch_id: null
      })
      .eq('batch_id', batchId)

    if (resetTransactionsError) {
      throw resetTransactionsError
    }

    // Delete the batch
    const { error: deleteBatchError } = await supabase
      .from('journal_entry_batches')
      .delete()
      .eq('id', batchId)

    if (deleteBatchError) {
      throw deleteBatchError
    }

    return NextResponse.json({
      success: true,
      message: 'Journal entry batch canceled successfully. Transactions returned to pending.'
    })
  } catch (error) {
    console.error('Error canceling journal entry batch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel journal entry batch' },
      { status: 500 }
    )
  }
}