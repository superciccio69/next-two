import { useState } from 'react';
import { Employee } from '@/types/employee';

interface EmployeeFormProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  base_salary: string;
  status: 'active' | 'inactive';
  hire_date: string;
  address: string;
  tax_id: string;
  bank_account: string;
  emergency_contact: string;
  emergency_phone: string;
}

export default function EmployeeForm({ employee, onClose, onSave }: EmployeeFormProps) {
  // Rimuoviamo la funzione formatDate e modifichiamo l'inizializzazione dello state
  const [formData, setFormData] = useState<FormData>({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    department: employee?.department || '',
    role: employee?.role || '',
    base_salary: employee?.base_salary?.toString() || '',
    status: employee?.status || 'active',
    hire_date: employee?.hire_date?.substring(0, 10) || '',  // Prendiamo solo YYYY-MM-DD
    address: employee?.address || '',
    tax_id: employee?.tax_id || '',
    bank_account: employee?.bank_account || '',
    emergency_contact: employee?.emergency_contact || '',
    emergency_phone: employee?.emergency_phone || ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/employees', {
        method: employee ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: employee?.id,
          base_salary: Number(formData.base_salary),
          hire_date: employee?.hire_date && !formData.hire_date ? employee.hire_date : formData.hire_date
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save employee');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>
        
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
            <input
              type="number"
              value={formData.base_salary}
              onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            
            // Modifica l'input della data di assunzione
            <div>
              <label className="block text-sm font-medium text-gray-700">Hire Date</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required={!employee} // Required solo per nuovi dipendenti
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Account</label>
              <input
                type="text"
                value={formData.bank_account}
                onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
              <input
                type="tel"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            // Update the status change handler
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {employee ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}