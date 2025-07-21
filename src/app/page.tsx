'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase, StripeTransaction, JournalEntryBatch } from '@/lib/supabase'
import { getUnmappedPrograms } from '@/lib/journal-mapper'

export default function Dashboard() {
  const [pendingTransactions, setPendingTransactions] = useState<StripeTransaction[]>([])
  const [journalEntryBatches, setJournalEntryBatches] = useState<JournalEntryBatch[]>([])
  const [currentBatch, setCurrentBatch] = useState<{
    id: string
    name: string
    totalTransactions: number
    totalAmount: number
  } | null>(null)
  const [unmappedPrograms, setUnmappedPrograms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        pendingTransactionsResult,
        batchesResult, 
        unmappedResult
      ] = await Promise.all([
        supabase.from('stripe_transactions').select('*').eq('processed', false).order('created_at', { ascending: false }),
        supabase.from('journal_entry_batches').select('*').order('created_at', { ascending: false }).limit(20),
        getUnmappedPrograms()
      ])

      if (pendingTransactionsResult.data) setPendingTransactions(pendingTransactionsResult.data)
      if (batchesResult.data) {
        setJournalEntryBatches(batchesResult.data)
        
        // Check for existing draft batch and set/update as current batch
        const draftBatch = batchesResult.data.find(batch => batch.status === 'draft')
        if (draftBatch) {
          // Always update current batch to reflect latest database state
          setCurrentBatch({
            id: draftBatch.id,
            name: draftBatch.batch_name,
            totalTransactions: draftBatch.total_transactions,
            totalAmount: draftBatch.total_amount
          })
        } else {
          // Clear current batch if no draft batch exists
          setCurrentBatch(null)
        }
      }
      setUnmappedPrograms(unmappedResult)
    } catch {
      console.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initializePage = async () => {
      // First fetch existing data to show current batch immediately
      await fetchData()
      
      // Then sync transactions from Stripe in the background
      setStatusMessage('Syncing transactions from Stripe...')
      try {
        const response = await fetch('/api/sync-transactions', { method: 'POST' })
        const result = await response.json()
        setStatusMessage(result.message)
        
        // Refresh data after sync
        await fetchData()
      } catch {
        setStatusMessage('Error syncing transactions')
      }
    }
    
    initializePage()
  }, [fetchData])



  const createJournalBatch = async () => {
    setLoading(true)
    setStatusMessage('Creating journal entry batch...')
    try {
      const response = await fetch('/api/create-journal-batch', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        // Update current batch with the latest data from the API response
        setCurrentBatch({
          id: result.batch.id,
          name: result.batch.batch_name,
          totalTransactions: result.batch.total_transactions,
          totalAmount: result.batch.total_amount
        })
        setStatusMessage(result.message)
        fetchData()
      } else {
        setStatusMessage(result.message || 'Error creating journal entry batch')
      }
    } catch {
      setStatusMessage('Error creating journal entry batch')
    } finally {
      setLoading(false)
    }
  }

  const downloadBatchExcel = async (batchId: string) => {
    setLoading(true)
    setStatusMessage('Generating Excel file...')
    try {
      const response = await fetch(`/api/download-batch-excel?batchId=${batchId}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `journal_batch_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setStatusMessage('Excel file downloaded successfully')
      } else {
        const result = await response.json()
        setStatusMessage(result.message || 'Error generating Excel file')
      }
    } catch {
      setStatusMessage('Error downloading Excel file')
    } finally {
      setLoading(false)
    }
  }

  const completeBatch = async (batchId: string) => {
    setLoading(true)
    setStatusMessage('Marking journal entry batch as uploaded...')
    try {
      const response = await fetch('/api/complete-journal-batch', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })
      const result = await response.json()
      
      if (result.success) {
        setCurrentBatch(null)
        setStatusMessage(result.message)
        fetchData()
      } else {
        setStatusMessage(result.message || 'Error marking journal entry batch as uploaded')
      }
    } catch {
      setStatusMessage('Error marking journal entry batch as uploaded')
    } finally {
      setLoading(false)
    }
  }

  const cancelBatch = async (batchId: string) => {
    setLoading(true)
    setStatusMessage('Canceling journal entry batch...')
    try {
      const response = await fetch('/api/cancel-journal-batch', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })
      const result = await response.json()
      
      if (result.success) {
        setCurrentBatch(null)
        setStatusMessage(result.message)
        fetchData()
      } else {
        setStatusMessage(result.message || 'Error canceling journal entry batch')
      }
    } catch {
      setStatusMessage('Error canceling journal entry batch')
    } finally {
      setLoading(false)
    }
  }

  const pendingTransactionCount = pendingTransactions.length
  const completedBatchCount = journalEntryBatches.filter(b => b.status === 'completed').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stripe Journal Automation</h1>
        <Link
          href="/mappings"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Manage Program Mappings
        </Link>
      </div>


      {unmappedPrograms.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> The following programs need mappings configured:
              </p>
              <ul className="mt-2 text-sm text-yellow-600">
                {unmappedPrograms.map((program, index) => (
                  <li key={index}>• {program}</li>
                ))}
              </ul>
              <Link
                href="/mappings"
                className="mt-2 inline-block text-sm text-yellow-800 underline"
              >
                Configure mappings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {currentBatch ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-purple-400">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">Current Journal Entry Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Batch Name</p>
              <p className="font-medium">{currentBatch.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="font-medium">{currentBatch.totalTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium">${(currentBatch.totalAmount / 100).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => downloadBatchExcel(currentBatch.id)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded shadow-sm"
              >
                Download Excel
              </button>
              <button
                onClick={() => completeBatch(currentBatch.id)}
                disabled={loading}
                className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border border-gray-300 font-medium py-2 px-4 rounded shadow-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Journal Entry Uploaded</span>
              </button>
            </div>
            <button
              onClick={() => cancelBatch(currentBatch.id)}
              disabled={loading}
              className="text-gray-500 hover:text-red-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <button
            onClick={createJournalBatch}
            disabled={loading || pendingTransactionCount === 0}
            className="bg-purple-500 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded"
          >
            Create Journal Entry ({pendingTransactionCount})
          </button>
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pending Transactions ({pendingTransactionCount})</h2>
            {statusMessage && (
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                {statusMessage.includes('Syncing') && (
                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTransactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-4 text-sm text-gray-900">{transaction.program_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">${(transaction.amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No pending transactions. Process some transactions first.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Completed Journal Entry Batches ({completedBatchCount})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journalEntryBatches.filter(b => b.status === 'completed').slice(0, 10).map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-4 text-sm text-gray-900">{batch.batch_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{batch.total_transactions}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">${(batch.total_amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {batch.completed_at ? new Date(batch.completed_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => downloadBatchExcel(batch.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {completedBatchCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                No completed journal entry batches yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
