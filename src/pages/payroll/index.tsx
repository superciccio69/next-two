import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import PayrollList from '@/components/payroll/PayrollList';
import PayrollForm from '@/components/payroll/PayrollForm';

export default function PayrollPage() {
  const { data: session } = useSession();
  const [payrolls, setPayrolls] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await fetch('/api/payroll');
      if (!response.ok) throw new Error('Failed to fetch payrolls');
      const data = await response.json();
      setPayrolls(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestione Buste Paga</h1>
          <button
            onClick={() => {
              setSelectedPayroll(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Nuova Busta Paga
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Caricamento...</div>
        ) : (
          <PayrollList
            payrolls={payrolls}
            onEdit={(payroll) => {
              setSelectedPayroll(payroll);
              setIsFormOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm('Sei sicuro di voler eliminare questa busta paga?')) {
                try {
                  const response = await fetch(`/api/payroll/${id}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) throw new Error('Failed to delete payroll');
                  fetchPayrolls();
                } catch (error) {
                  console.error('Error:', error);
                }
              }
            }}
          />
        )}

        {isFormOpen && (
          <PayrollForm
            payroll={selectedPayroll}
            onClose={() => setIsFormOpen(false)}
            onSave={() => {
              setIsFormOpen(false);
              fetchPayrolls();
            }}
          />
        )}
      </div>
    </Layout>
  );
}