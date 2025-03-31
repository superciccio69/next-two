import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PayrollDetailsProps {
  payroll: any;
  onClose: () => void;
}

export default function PayrollDetails({ payroll, onClose }: PayrollDetailsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch(`/api/payroll/${payroll.id}/pdf`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `busta-paga-${payroll.employee_name}-${payroll.period_month}-${payroll.period_year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dettagli Busta Paga</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Dipendente</h3>
              <p className="mt-1 text-lg">{payroll.employee_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Periodo</h3>
              <p className="mt-1 text-lg">
                {format(new Date(payroll.period_year, payroll.period_month - 1), 'MMMM yyyy', { locale: it })}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Retribuzione</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Lordo</p>
                <p className="text-lg">€ {payroll.gross_salary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Netto</p>
                <p className="text-lg">€ {payroll.net_salary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Trattenute</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">INPS</p>
                  <p>€ {payroll.inps_contribution.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IRPEF</p>
                  <p>€ {payroll.irpef_tax.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Addizionale Regionale</p>
                  <p>€ {payroll.regional_tax.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Addizionale Comunale</p>
                  <p>€ {payroll.municipal_tax.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Stato</h3>
            <span className={`px-2 py-1 text-sm font-semibold rounded-full 
              ${payroll.status === 'paid' ? 'bg-green-100 text-green-800' : 
                payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                'bg-yellow-100 text-yellow-800'}`}>
              {payroll.status === 'paid' ? 'Pagato' :
               payroll.status === 'approved' ? 'Approvato' : 'Bozza'}
            </span>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isGeneratingPDF ? 'Generazione...' : 'Genera PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}