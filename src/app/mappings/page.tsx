'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, ProgramMapping } from '@/lib/supabase'
import * as XLSX from 'xlsx'

interface ExcelMappingRow {
  'PROGRAM NAME': string
  'ENTITY': string
  'ORG': string
  'FUNDING': string
  'ACTIVITY': string
  'SUBACTIVITY': string
  'NATURAL_CLASS': string
  'DEBIT': string | number
  'CREDIT': string | number
}

export default function MappingsPage() {
  const [mappings, setMappings] = useState<ProgramMapping[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<ProgramMapping | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    program_name: '',
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
  })

  useEffect(() => {
    fetchMappings()
  }, [])

  const fetchMappings = async () => {
    const { data, error } = await supabase
      .from('program_mappings')
      .select('*')
      .order('program_name')
    
    if (error) {
      console.error('Error fetching mappings:', error)
    } else {
      setMappings(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMapping) {
        const { error } = await supabase
          .from('program_mappings')
          .update(formData)
          .eq('id', editingMapping.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('program_mappings')
          .insert([formData])
        
        if (error) throw error
      }
      
      setFormData({
        program_name: '',
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
      })
      setShowForm(false)
      setEditingMapping(null)
      fetchMappings()
    } catch (error) {
      console.error('Error saving mapping:', error)
    }
  }

  const handleEdit = (mapping: ProgramMapping) => {
    setEditingMapping(mapping)
    setFormData({
      program_name: mapping.program_name,
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
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this mapping?')) {
      const { error } = await supabase
        .from('program_mappings')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting mapping:', error)
      } else {
        fetchMappings()
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMapping(null)
    setFormData({
      program_name: '',
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
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadStatus(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: ExcelMappingRow[] = XLSX.utils.sheet_to_json(worksheet)

      const mappingsToInsert = await processBulkMappings(jsonData)
      
      if (mappingsToInsert.length > 0) {
        const { error } = await supabase
          .from('program_mappings')
          .upsert(mappingsToInsert, { 
            onConflict: 'program_name',
            ignoreDuplicates: false 
          })

        if (error) throw error

        setUploadStatus(`Successfully uploaded ${mappingsToInsert.length} program mappings`)
        fetchMappings()
      } else {
        setUploadStatus('No valid mappings found in the uploaded file')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      setUploadStatus('Error processing file. Please check the format and try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const processBulkMappings = async (rows: ExcelMappingRow[]): Promise<Partial<ProgramMapping>[]> => {
    const mappingsMap = new Map<string, {
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
    }>()

    for (const row of rows) {
      const programName = row['PROGRAM NAME']?.toString().trim()
      if (!programName) continue

      if (!mappingsMap.has(programName)) {
        mappingsMap.set(programName, {
          program_name: programName,
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
        })
      }

      const mapping = mappingsMap.get(programName)!
      
      const hasDebit = row['DEBIT'] && row['DEBIT'].toString().trim() !== ''
      const hasCredit = row['CREDIT'] && row['CREDIT'].toString().trim() !== ''

      if (hasDebit) {
        mapping.debit_entity = row['ENTITY']?.toString().trim() || ''
        mapping.debit_org = row['ORG']?.toString().trim() || ''
        mapping.debit_funding = row['FUNDING']?.toString().trim() || ''
        mapping.debit_activity = row['ACTIVITY']?.toString().trim() || ''
        mapping.debit_subactivity = row['SUBACTIVITY']?.toString().trim() || ''
        mapping.debit_natural_class = row['NATURAL_CLASS']?.toString().trim() || ''
      }

      if (hasCredit) {
        mapping.credit_entity = row['ENTITY']?.toString().trim() || ''
        mapping.credit_org = row['ORG']?.toString().trim() || ''
        mapping.credit_funding = row['FUNDING']?.toString().trim() || ''
        mapping.credit_activity = row['ACTIVITY']?.toString().trim() || ''
        mapping.credit_subactivity = row['SUBACTIVITY']?.toString().trim() || ''
        mapping.credit_natural_class = row['NATURAL_CLASS']?.toString().trim() || ''
      }
    }

    return Array.from(mappingsMap.values()).filter(mapping => 
      mapping.program_name && 
      (mapping.debit_entity || mapping.credit_entity)
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Program Mappings</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {uploading ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Mapping
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          uploadStatus.includes('Successfully') 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {uploadStatus}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Excel Upload Format</h3>
        <p className="text-sm text-blue-700 mb-3">
          Upload an Excel file with the following column headers. Each row should contain either a DEBIT or CREDIT value (not both):
        </p>
        <div className="bg-white p-3 rounded border overflow-x-auto">
          <table className="text-xs text-gray-600">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2">PROGRAM NAME</th>
                <th className="text-left px-2">ENTITY</th>
                <th className="text-left px-2">ORG</th>
                <th className="text-left px-2">FUNDING</th>
                <th className="text-left px-2">ACTIVITY</th>
                <th className="text-left px-2">SUBACTIVITY</th>
                <th className="text-left px-2">NATURAL_CLASS</th>
                <th className="text-left px-2">DEBIT</th>
                <th className="text-left px-2">CREDIT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1">Spring LSI</td>
                <td className="px-2 py-1">111111</td>
                <td className="px-2 py-1">222222</td>
                <td className="px-2 py-1">333333</td>
                <td className="px-2 py-1">444444</td>
                <td className="px-2 py-1">555555</td>
                <td className="px-2 py-1">666666</td>
                <td className="px-2 py-1">3000</td>
                <td className="px-2 py-1"></td>
              </tr>
              <tr>
                <td className="px-2 py-1">Spring LSI</td>
                <td className="px-2 py-1">777777</td>
                <td className="px-2 py-1">888888</td>
                <td className="px-2 py-1">999999</td>
                <td className="px-2 py-1">100000</td>
                <td className="px-2 py-1">110000</td>
                <td className="px-2 py-1">120000</td>
                <td className="px-2 py-1"></td>
                <td className="px-2 py-1">3000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Create a mapping from program names in Stripe transactions to account codes to use in the journal entry for the transaction. When a journal entry batch is created, the mapping is used to fill in the account codes in the journal entries. 
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Program Name <span className="text-red-500">*</span>
              </h3>
              <input
                type="text"
                value={formData.program_name}
                onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                className="block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 placeholder-gray-300"
                placeholder="e.g. Spring LSI, TuckLAB E-Ship, Summer Bridge"
                required
              />
            </div>

            {/* Mapping Arrow */}
            <div className="flex justify-center items-center py-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Debit Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-4">Debit Entry</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity</label>
                    <input
                      type="text"
                      value={formData.debit_entity}
                      onChange={(e) => setFormData({ ...formData, debit_entity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Org</label>
                    <input
                      type="text"
                      value={formData.debit_org}
                      onChange={(e) => setFormData({ ...formData, debit_org: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funding</label>
                    <input
                      type="text"
                      value={formData.debit_funding}
                      onChange={(e) => setFormData({ ...formData, debit_funding: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Activity</label>
                    <input
                      type="text"
                      value={formData.debit_activity}
                      onChange={(e) => setFormData({ ...formData, debit_activity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subactivity</label>
                    <input
                      type="text"
                      value={formData.debit_subactivity}
                      onChange={(e) => setFormData({ ...formData, debit_subactivity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Natural Class</label>
                    <input
                      type="text"
                      value={formData.debit_natural_class}
                      onChange={(e) => setFormData({ ...formData, debit_natural_class: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              {/* Credit Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-4">Credit Entry</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity</label>
                    <input
                      type="text"
                      value={formData.credit_entity}
                      onChange={(e) => setFormData({ ...formData, credit_entity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Org</label>
                    <input
                      type="text"
                      value={formData.credit_org}
                      onChange={(e) => setFormData({ ...formData, credit_org: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funding</label>
                    <input
                      type="text"
                      value={formData.credit_funding}
                      onChange={(e) => setFormData({ ...formData, credit_funding: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Activity</label>
                    <input
                      type="text"
                      value={formData.credit_activity}
                      onChange={(e) => setFormData({ ...formData, credit_activity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subactivity</label>
                    <input
                      type="text"
                      value={formData.credit_subactivity}
                      onChange={(e) => setFormData({ ...formData, credit_subactivity: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Natural Class</label>
                    <input
                      type="text"
                      value={formData.credit_natural_class}
                      onChange={(e) => setFormData({ ...formData, credit_natural_class: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-md focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {editingMapping ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Debit Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Credit Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mapping.program_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    <div className="bg-green-50 p-2 rounded text-xs">
                      <div><strong>Entity:</strong> {mapping.debit_entity}</div>
                      <div><strong>Org:</strong> {mapping.debit_org}</div>
                      <div><strong>Funding:</strong> {mapping.debit_funding}</div>
                      <div><strong>Activity:</strong> {mapping.debit_activity}</div>
                      <div><strong>Subactivity:</strong> {mapping.debit_subactivity}</div>
                      <div><strong>Natural Class:</strong> {mapping.debit_natural_class}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <div><strong>Entity:</strong> {mapping.credit_entity}</div>
                      <div><strong>Org:</strong> {mapping.credit_org}</div>
                      <div><strong>Funding:</strong> {mapping.credit_funding}</div>
                      <div><strong>Activity:</strong> {mapping.credit_activity}</div>
                      <div><strong>Subactivity:</strong> {mapping.credit_subactivity}</div>
                      <div><strong>Natural Class:</strong> {mapping.credit_natural_class}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(mapping)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(mapping.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mappings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No program mappings found. Add your first mapping to get started.
          </div>
        )}
      </div>
    </div>
  )
}