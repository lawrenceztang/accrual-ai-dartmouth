import { JournalEntry } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export interface JournalEntryWithTransaction extends JournalEntry {
  transaction?: {
    program_name: string
  }
}

export interface ExcelJournalEntry {
  entity: string
  org: string
  funding: string
  activity: string
  subactivity: string
  natural_class: string
  debit: number | string
  credit: number | string
  line_description: string
}

export function generateExcelFile(journalEntries: JournalEntryWithTransaction[]): Buffer {
  const excelData: ExcelJournalEntry[] = []
  
  // Group entries by transaction_id to add separators between double-sided entries
  const groupedEntries = new Map<string, JournalEntryWithTransaction[]>()
  journalEntries.forEach(entry => {
    if (!groupedEntries.has(entry.transaction_id)) {
      groupedEntries.set(entry.transaction_id, [])
    }
    groupedEntries.get(entry.transaction_id)!.push(entry)
  })

  // Process each transaction group
  for (const [transactionId, entries] of groupedEntries) {
    // Add the debit and credit entries for this transaction
    entries.forEach(entry => {
      const amount = entry.amount / 100 // Convert from cents to dollars
      const programName = entry.transaction?.program_name || 'Unknown Program'
      
      excelData.push({
        entity: entry.entity,
        org: entry.org,
        funding: entry.funding,
        activity: entry.activity,
        subactivity: entry.subactivity,
        natural_class: entry.natural_class,
        debit: entry.entry_type === 'debit' ? amount : '',
        credit: entry.entry_type === 'credit' ? amount : '',
        line_description: programName
      })
    })
    
    // Add a completely empty separator row between each transaction's double-sided entry
    excelData.push({
      entity: '',
      org: '',
      funding: '',
      activity: '',
      subactivity: '',
      natural_class: '',
      debit: '',
      credit: '',
      line_description: ''
    })
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Set column headers
  const headers = [
    'Entity',
    'Org', 
    'Funding',
    'Activity',
    'Subactivity',
    'Natural Class',
    'Debit',
    'Credit',
    'Line Description'
  ]

  // Update the worksheet with proper headers
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })

  // Make headers bold
  for (let i = 0; i < headers.length; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
    if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {}
    worksheet[cellAddress].s.font = { bold: true }
  }

  // Auto-size columns
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }))
  worksheet['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Entries')

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  return excelBuffer
}

export function generateExcelFileName(): string {
  const now = new Date()
  const timestamp = now.toISOString().split('T')[0] // YYYY-MM-DD
  return `journal_entries_${timestamp}.xlsx`
}