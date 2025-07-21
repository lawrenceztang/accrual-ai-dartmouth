import { supabase, ProgramMapping, StripeTransaction, JournalEntry } from '@/lib/supabase'

export interface JournalEntryData {
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
  amount: number
}

export async function mapTransactionToJournalEntry(
  transaction: StripeTransaction
): Promise<JournalEntryData> {
  try {
    const { data: mapping, error } = await supabase
      .from('program_mappings')
      .select('*')
      .eq('program_name', transaction.program_name)
      .single()

    if (error || !mapping) {
      console.warn(`No mapping found for program: ${transaction.program_name}, creating entry with blank fields`)
      // Return blank fields for unmapped transactions
      return {
        debit_entity: '',
        debit_org: '',
        debit_funding: '',
        debit_activity: '',
        debit_subactivity: '',
        debit_natural_class: '',
        credit_entity: '',
        credit_org: '',
        credit_funding: '',
        credit_activity: '',
        credit_subactivity: '',
        credit_natural_class: '',
        amount: transaction.amount,
      }
    }

    return {
      debit_entity: mapping.debit_entity,
      debit_org: mapping.debit_org,
      debit_funding: mapping.debit_funding,
      debit_activity: mapping.debit_activity,
      debit_subactivity: mapping.debit_subactivity,
      debit_natural_class: mapping.debit_natural_class,
      credit_entity: mapping.credit_entity,
      credit_org: mapping.credit_org,
      credit_funding: mapping.credit_funding,
      credit_activity: mapping.credit_activity,
      credit_subactivity: mapping.credit_subactivity,
      credit_natural_class: mapping.credit_natural_class,
      amount: transaction.amount,
    }
  } catch (error) {
    console.error('Error mapping transaction to journal entry:', error)
    // Return blank fields if there's an error
    return {
      debit_entity: '',
      debit_org: '',
      debit_funding: '',
      debit_activity: '',
      debit_subactivity: '',
      debit_natural_class: '',
      credit_entity: '',
      credit_org: '',
      credit_funding: '',
      credit_activity: '',
      credit_subactivity: '',
      credit_natural_class: '',
      amount: transaction.amount,
    }
  }
}

export async function createJournalEntries(
  transactionId: string,
  journalData: JournalEntryData
): Promise<JournalEntry[]> {
  try {
    // Create both debit and credit entries
    const entries = [
      {
        transaction_id: transactionId,
        entity: journalData.debit_entity,
        org: journalData.debit_org,
        funding: journalData.debit_funding,
        activity: journalData.debit_activity,
        subactivity: journalData.debit_subactivity,
        natural_class: journalData.debit_natural_class,
        amount: journalData.amount,
        entry_type: 'debit' as const,
      },
      {
        transaction_id: transactionId,
        entity: journalData.credit_entity,
        org: journalData.credit_org,
        funding: journalData.credit_funding,
        activity: journalData.credit_activity,
        subactivity: journalData.credit_subactivity,
        natural_class: journalData.credit_natural_class,
        amount: journalData.amount,
        entry_type: 'credit' as const,
      }
    ]

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entries)
      .select()

    if (error) {
      console.error('Error creating journal entries:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating journal entries:', error)
    throw error
  }
}

export async function processUnprocessedTransactions(): Promise<{
  processed: number
  errors: number
  missingMappings: string[]
}> {
  const results = {
    processed: 0,
    errors: 0,
    missingMappings: [] as string[],
  }

  try {
    const { data: transactions, error } = await supabase
      .from('stripe_transactions')
      .select('*')
      .eq('processed', false)

    if (error) {
      console.error('Error fetching unprocessed transactions:', error)
      return results
    }

    for (const transaction of transactions || []) {
      try {
        const journalData = await mapTransactionToJournalEntry(transaction)
        
        if (!journalData) {
          results.missingMappings.push(transaction.program_name)
          continue
        }

        const journalEntries = await createJournalEntries(transaction.id, journalData)
        
        if (journalEntries) {
          await supabase
            .from('stripe_transactions')
            .update({ processed: true })
            .eq('id', transaction.id)
          
          results.processed++
        } else {
          results.errors++
        }
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error)
        results.errors++
      }
    }
  } catch (error) {
    console.error('Error processing transactions:', error)
    results.errors++
  }

  return results
}

export async function getUnmappedPrograms(): Promise<string[]> {
  try {
    const { data: transactions, error: transactionError } = await supabase
      .from('stripe_transactions')
      .select('program_name')
      .eq('processed', false)

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError)
      return []
    }

    const { data: mappings, error: mappingError } = await supabase
      .from('program_mappings')
      .select('program_name')

    if (mappingError) {
      console.error('Error fetching mappings:', mappingError)
      return []
    }

    const mappedPrograms = new Set(mappings?.map(m => m.program_name) || [])
    const unmappedPrograms = new Set<string>()

    transactions?.forEach(t => {
      if (!mappedPrograms.has(t.program_name)) {
        unmappedPrograms.add(t.program_name)
      }
    })

    return Array.from(unmappedPrograms)
  } catch (error) {
    console.error('Error getting unmapped programs:', error)
    return []
  }
}