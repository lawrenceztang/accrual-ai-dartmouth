import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateExcelFile, generateExcelFileName } from '@/lib/excel'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get journal entries for this batch with transaction data
    const { data: journalEntries, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        transaction:stripe_transactions!transaction_id (
          program_name
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at')

    if (error) {
      throw error
    }

    if (!journalEntries || journalEntries.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No journal entries found for this batch',
      })
    }

    // Get batch info for filename
    const { data: batch } = await supabase
      .from('journal_entry_batches')
      .select('batch_name')
      .eq('id', batchId)
      .single()

    // Generate Excel file
    const excelBuffer = generateExcelFile(journalEntries)
    const fileName = batch 
      ? `${batch.batch_name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
      : generateExcelFileName()

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating batch Excel file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate Excel file' },
      { status: 500 }
    )
  }
}