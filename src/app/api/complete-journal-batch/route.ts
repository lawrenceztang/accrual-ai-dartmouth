import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { batchId } = await request.json()

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Update batch status to completed
    const { error: batchError } = await supabase
      .from('journal_entry_batches')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId)

    if (batchError) {
      throw batchError
    }

    // Journal entries are already created and don't need additional processing
    // The batch status change is sufficient to mark completion

    return NextResponse.json({
      success: true,
      message: 'Journal entry batch completed successfully'
    })
  } catch (error) {
    console.error('Error completing journal entry batch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete journal entry batch' },
      { status: 500 }
    )
  }
}