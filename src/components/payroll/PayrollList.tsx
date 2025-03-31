import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PencilIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface PayrollListProps {
  payrolls: any[];
  onEdit: (payroll: any) => void;
  onDelete: (id: number) => void;
  onViewDetails?: (payroll: any) => void;
}

export default function PayrollList({ payrolls, onEdit, onDelete, onViewDetails }: PayrollListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dipendente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Periodo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lordo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Netto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stato
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payrolls.map((payroll) => (
            <tr key={payroll.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {payroll.employee_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(new Date(payroll.period_year, payroll.period_month - 1), 'MMMM yyyy', { locale: it })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                € {payroll.gross_salary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                € {payroll.net_salary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                  ${payroll.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {payroll.status === 'paid' ? 'Pagato' :
                   payroll.status === 'approved' ? 'Approvato' : 'Bozza'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  onClick={() => onViewDetails?.(payroll)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <DocumentIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onEdit(payroll)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                {payroll.status === 'draft' && (
                  <button
                    onClick={() => onDelete(payroll.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}