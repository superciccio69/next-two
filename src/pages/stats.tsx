import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

interface StatsSummary {
  totalEmployees: number;
  activeEmployees: number;
  averageAttendance: number;
  totalHoursWorked: number;
}

interface DepartmentStats {
  name: string;
  employeeCount: number;
  attendanceRate: number;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export default function StatsPage() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // In a real app, these would be API calls with the timeFilter parameter
        const summaryRes = await fetch(`/api/stats/summary?period=${timeFilter}`);
        const departmentsRes = await fetch(`/api/stats/departments?period=${timeFilter}`);
        const trendRes = await fetch(`/api/stats/attendance-trend?period=${timeFilter}`);

        const summaryData = await summaryRes.json();
        const departmentsData = await departmentsRes.json();
        const trendData = await trendRes.json();

        setSummary(summaryData);
        setDepartmentStats(departmentsData);
        setAttendanceTrend(trendData);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeFilter]);

  // Prepare data for attendance trend chart
  const trendData = {
    labels: attendanceTrend.map(day => day.date),
    datasets: [
      {
        label: 'Presenti',
        data: attendanceTrend.map(day => day.present),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Assenti',
        data: attendanceTrend.map(day => day.absent),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'In ritardo',
        data: attendanceTrend.map(day => day.late),
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for department comparison chart
  const departmentData = {
    labels: departmentStats.map(dept => dept.name),
    datasets: [
      {
        label: 'Tasso di presenza (%)',
        data: departmentStats.map(dept => dept.attendanceRate),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiche</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-md ${
                  timeFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-md ${
                  timeFilter === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => setTimeFilter('year')}
                className={`px-4 py-2 rounded-md ${
                  timeFilter === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Anno
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500 dark:text-gray-400">Caricamento statistiche...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Dipendenti Totali</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary?.totalEmployees || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Dipendenti Attivi</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary?.activeEmployees || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Presenza Media</h3>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary?.averageAttendance || 0}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Ore Lavorate</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summary?.totalHoursWorked || 0}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Trend Presenze</h3>
                  <div className="h-80">
                    <Line 
                      data={trendData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              color: 'rgb(107, 114, 128)'
                            }
                          },
                          x: {
                            ticks: {
                              color: 'rgb(107, 114, 128)'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: 'rgb(107, 114, 128)'
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Statistiche per Reparto</h3>
                  <div className="h-80">
                    <Bar 
                      data={departmentData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              color: 'rgb(107, 114, 128)'
                            }
                          },
                          x: {
                            ticks: {
                              color: 'rgb(107, 114, 128)'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: 'rgb(107, 114, 128)'
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}