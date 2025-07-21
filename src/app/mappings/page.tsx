'use client'

import { useState, useEffect } from 'react'
import { supabase, ProgramMapping } from '@/lib/supabase'

export default function MappingsPage() {
  const [mappings, setMappings] = useState<ProgramMapping[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<ProgramMapping | null>(null)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Program Mappings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Mapping
        </button>
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