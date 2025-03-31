import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';

interface PayrollFormProps {
  payroll: any | null;
  onClose: () => void;
  onSave: () => void;
}

export default function PayrollForm({ payroll, onClose, onSave }: PayrollFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    employee_id: payroll?.employee_id || '',
    period_month: payroll?.period_month || new Date().getMonth() + 1,
    period_year: payroll?.period_year || new Date().getFullYear(),
    gross_salary: payroll?.gross_salary || '',
    net_salary: payroll?.net_salary || '',
    total_deductions: payroll?.total_deductions || '',
    total_contributions: payroll?.total_contributions || '',
    inps_contribution: payroll?.inps_contribution || '',
    irpef_tax: payroll?.irpef_tax || '',
    regional_tax: payroll?.regional_tax || '',
    municipal_tax: payroll?.municipal_tax || '',
    status: payroll?.status || 'draft'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(payroll ? `/api/payroll/${payroll.id}` : '/api/payroll', {
        method: payroll ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: payroll?.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save payroll');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {payroll ? 'Modifica Busta Paga' : 'Nuova Busta Paga'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dipendente</label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              >
                <option value="">Seleziona Dipendente</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Periodo</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formData.period_month}
                  onChange={(e) => setFormData({...formData, period_month: Number(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('it-IT', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={formData.period_year}
                  onChange={(e) => setFormData({...formData, period_year: Number(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  min="2000"
                  max="2100"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Stipendio Lordo</label>
              <input
                type="number"
                value={formData.gross_salary}
                onChange={(e) => setFormData({...formData, gross_salary: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stipendio Netto</label>
              <input
                type="number"
                value={formData.net_salary}
                onChange={(e) => setFormData({...formData, net_salary: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contributi INPS</label>
              <input
                type="number"
                value={formData.inps_contribution}
                onChange={(e) => setFormData({...formData, inps_contribution: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IRPEF</label>
              <input
                type="number"
                value={formData.irpef_tax}
                onChange={(e) => setFormData({...formData, irpef_tax: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Addizionale Regionale</label>
              <input
                type="number"
                value={formData.regional_tax}
                onChange={(e) => setFormData({...formData, regional_tax: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Addizionale Comunale</label>
              <input
                type="number"
                value={formData.municipal_tax}
                onChange={(e) => setFormData({...formData, municipal_tax: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stato</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="draft">Bozza</option>
              <option value="approved">Approvato</option>
              <option value="paid">Pagato</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {payroll ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}