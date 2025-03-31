import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Layout from '@/components/Layout';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [payrollStats, setPayrollStats] = useState<any>(null);
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setEmployeeStats(data.employeeStats);
      setPayrollStats(data.payrollStats);
      setDepartmentStats(data.departmentStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Impossibile caricare i dati. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  const payrollData = {
    labels: ['Bozza', 'Approvate', 'Pagate'],
    datasets: [{
      data: [
        payrollStats?.draft || 0,
        payrollStats?.approved || 0,
        payrollStats?.paid || 0
      ],
      backgroundColor: ['#FCD34D', '#60A5FA', '#34D399'],
      borderColor: ['#FDE68A', '#93C5FD', '#6EE7B7'],
      borderWidth: 1,
    }]
  };

  const employeeData = {
    labels: ['Attivi', 'In Ferie', 'Malattia'],
    datasets: [{
      data: [
        employeeStats?.active || 0,
        employeeStats?.onVacation || 0,
        employeeStats?.onSickLeave || 0
      ],
      backgroundColor: ['#34D399', '#60A5FA', '#F87171'],
      borderColor: ['#6EE7B7', '#93C5FD', '#FCA5A5'],
      borderWidth: 1,
    }]
  };

  const departmentData = {
    labels: departmentStats?.map((d: any) => d.name) || [],
    datasets: [{
      data: departmentStats?.map((d: any) => d.count) || [],
      backgroundColor: [
        '#34D399', '#60A5FA', '#F87171', '#FCD34D', '#A78BFA',
        '#F472B6', '#4ADE80', '#2DD4BF', '#FB923C'
      ],
      borderWidth: 1,
    }]
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento dati...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Riprova
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Dipendenti Totali</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {employeeStats?.active || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Buste Paga Mensili</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(payrollStats?.draft || 0) + (payrollStats?.approved || 0) + (payrollStats?.paid || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">In Ferie</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {employeeStats?.onVacation || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">In Malattia</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {employeeStats?.onSickLeave || 0}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Stato Buste Paga</h2>
            <div className="h-64">
              <Pie 
                data={payrollData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { padding: 20 }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Stato Dipendenti</h2>
            <div className="h-64">
              <Pie 
                data={employeeData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { padding: 20 }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Dipendenti per Reparto</h2>
            <div className="h-64">
              <Pie 
                data={departmentData} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { padding: 20 }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}