import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaEdit, FaPlus, FaSearch, FaCalendarAlt, FaFileExport } from 'react-icons/fa';

interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  notes?: string;
  hoursWorked?: number;
}

interface Employee {
  id: number;
  name: string;
  department: string;
}

export default function PresenzePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  const [selectedEmployee, setSelectedEmployee] = useState<number | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<Partial<Attendance> | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        } else {
          console.error('Error fetching employees:', response.status);
          // Set empty array as fallback when API fails
          setEmployees([]);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        // Set empty array as fallback when API fails
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  // For now, generate mock attendance data
  useEffect(() => {
    if (employees.length === 0) return;
    
    setIsLoading(true);
    
    // Calculate date range based on selection
    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);
    
    if (dateRange === 'week') {
      startDate = subDays(startDate, 3);
      endDate = addDays(endDate, 3);
    } else if (dateRange === 'month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }
    
    // Mock data - in a real app, you would fetch this from an API
    const mockAttendances: Attendance[] = [];
    
    // Generate data for each day in the range
    let currentDate = startDate;
    while (currentDate <= endDate) {
      employees.forEach((employee, index) => {
        // Randomize some values for demonstration
        const isPresent = Math.random() > 0.2;
        const isLate = isPresent && Math.random() > 0.7;
        const isLeave = !isPresent && Math.random() > 0.5;
        
        let status: 'present' | 'absent' | 'late' | 'leave' = 'absent';
        if (isPresent) status = isLate ? 'late' : 'present';
        if (isLeave) status = 'leave';
        
        const checkIn = isPresent ? (isLate ? '09:45' : '09:00') : '';
        const checkOut = isPresent ? (Math.random() > 0.3 ? '18:00' : '17:30') : '';
        
        // Calculate hours worked
        let hoursWorked = 0;
        if (checkIn && checkOut) {
          const [inHours, inMinutes] = checkIn.split(':').map(Number);
          const [outHours, outMinutes] = checkOut.split(':').map(Number);
          hoursWorked = (outHours - inHours) + (outMinutes - inMinutes) / 60;
          // Subtract 1 hour for lunch break
          if (hoursWorked > 5) hoursWorked -= 1;
        }
        
        mockAttendances.push({
          id: mockAttendances.length + 1,
          employeeId: employee.id,
          employeeName: employee.name,
          date: format(currentDate, 'yyyy-MM-dd'),
          checkIn,
          checkOut,
          status,
          notes: status === 'leave' ? 'Permesso richiesto' : '',
          hoursWorked: Math.round(hoursWorked * 10) / 10,
        });
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    setAttendances(mockAttendances);
    setIsLoading(false);
  }, [employees, selectedDate, dateRange]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    // Add null check before mapping
    const depts = new Set((employees || []).map(e => e.department));
    return Array.from(depts);
  }, [employees]);
  
  // Filter attendances based on selected employee, department and search term
  const filteredAttendances = useMemo(() => {
    return attendances.filter(attendance => {
      const employeeMatch = selectedEmployee === 'all' || attendance.employeeId === selectedEmployee;
      
      // Department filter
      let departmentMatch = true;
      if (selectedDepartment !== 'all') {
        // Add null check when finding employee
        const employee = (employees || []).find(e => e.id === attendance.employeeId);
        departmentMatch = employee?.department === selectedDepartment;
      }
      
      // Search term filter
      const searchMatch = 
        attendance.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      return employeeMatch && departmentMatch && searchMatch;
    });
  }, [attendances, selectedEmployee, selectedDepartment, searchTerm, employees]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredAttendances.length === 0) return null;
    
    const totalAttendances = filteredAttendances.length;
    const present = filteredAttendances.filter(a => a.status === 'present').length;
    const absent = filteredAttendances.filter(a => a.status === 'absent').length;
    const late = filteredAttendances.filter(a => a.status === 'late').length;
    const leave = filteredAttendances.filter(a => a.status === 'leave').length;
    
    const totalHours = filteredAttendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const avgHours = totalHours / (present + late);
    
    return {
      totalAttendances,
      present,
      absent,
      late,
      leave,
      presentPercentage: (present / totalAttendances) * 100,
      absentPercentage: (absent / totalAttendances) * 100,
      latePercentage: (late / totalAttendances) * 100,
      leavePercentage: (leave / totalAttendances) * 100,
      totalHours,
      avgHours: isNaN(avgHours) ? 0 : avgHours,
    };
  }, [filteredAttendances]);

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'leave':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Handle opening the modal for editing
  const handleEditAttendance = (attendance: Attendance) => {
    setCurrentAttendance(attendance);
    setIsModalOpen(true);
  };

  // Handle opening the modal for creating
  const handleAddAttendance = () => {
    setCurrentAttendance({
      date: selectedDate,
      status: 'present',
      checkIn: '09:00',
      checkOut: '18:00',
    });
    setIsModalOpen(true);
  };

  // Save attendance (create or update)
  const handleSaveAttendance = async () => {
    if (!currentAttendance || !currentAttendance.employeeId) return;
    
    // Calculate hours worked
    let hoursWorked = 0;
    if (currentAttendance.checkIn && currentAttendance.checkOut) {
      const [inHours, inMinutes] = currentAttendance.checkIn.split(':').map(Number);
      const [outHours, outMinutes] = currentAttendance.checkOut.split(':').map(Number);
      hoursWorked = (outHours - inHours) + (outMinutes - inMinutes) / 60;
      // Subtract 1 hour for lunch break
      if (hoursWorked > 5) hoursWorked -= 1;
    }
    
    // In a real app, you would save to the API here
    // For now, update the local state
    const employee = employees.find(e => e.id === currentAttendance.employeeId);
    
    const updatedAttendance = {
      ...currentAttendance,
      employeeName: employee?.name || '',
      hoursWorked: Math.round(hoursWorked * 10) / 10,
    } as Attendance;
    
    if (currentAttendance.id) {
      // Update existing attendance
      setAttendances(attendances.map(a => 
        a.id === currentAttendance.id ? updatedAttendance : a
      ));
    } else {
      // Create new attendance
      const newAttendance = {
        ...updatedAttendance,
        id: Math.max(...attendances.map(a => a.id), 0) + 1,
      };
      setAttendances([...attendances, newAttendance]);
    }
    
    setIsModalOpen(false);
    setCurrentAttendance(null);
  };

  // Export data to CSV
  const exportToCSV = () => {
    const headers = ['Dipendente', 'Data', 'Entrata', 'Uscita', 'Stato', 'Ore Lavorate', 'Note'];
    
    const csvData = filteredAttendances.map(a => [
      a.employeeName,
      format(new Date(a.date), 'dd/MM/yyyy'),
      a.checkIn || '-',
      a.checkOut || '-',
      a.status === 'present' ? 'Presente' : 
      a.status === 'absent' ? 'Assente' : 
      a.status === 'late' ? 'In ritardo' : 'In permesso',
      a.hoursWorked?.toString() || '0',
      a.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `presenze_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione Presenze</h1>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                {showStats ? 'Nascondi Statistiche' : 'Mostra Statistiche'}
              </button>
              
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <FaFileExport className="mr-2" /> Esporta CSV
              </button>
              
              <button
                onClick={handleAddAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" /> Nuova Presenza
              </button>
            </div>
          </div>
          
          {/* Statistics Panel */}
          {showStats && stats && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Statistiche</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Presenti</div>
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.presentPercentage.toFixed(1)}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.presentPercentage}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Assenti</div>
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.absentPercentage.toFixed(1)}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${stats.absentPercentage}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                  <div className="text-sm text-gray-500 dark:text-gray-400">In Ritardo</div>
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.latePercentage.toFixed(1)}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${stats.latePercentage}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ore Totali</div>
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHours.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Media: {stats.avgHours.toFixed(1)}h</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaCalendarAlt className="text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'day' | 'week' | 'month')}
                className="block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="day">Giorno singolo</option>
                <option value="week">Settimana</option>
                <option value="month">Mese intero</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">Tutti i dipendenti</option>
                {(employees || []).map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">Tutti i reparti</option>
                {(departments || []).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="relative md:col-span-2 lg:col-span-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cerca dipendente, stato o note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <p className="text-gray-500 dark:text-gray-400">Caricamento presenze...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Dipendente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Entrata
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Uscita
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Stato
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ore
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Note
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAttendances.map((attendance) => (
                        <tr key={attendance.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {attendance.employeeName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {format(new Date(attendance.date), 'dd/MM/yyyy', { locale: it })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {attendance.checkIn || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {attendance.checkOut || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(attendance.status)}`}>
                              {attendance.status === 'present' ? 'Presente' : 
                               attendance.status === 'absent' ? 'Assente' : 
                               attendance.status === 'late' ? 'In ritardo' : 'In permesso'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {attendance.hoursWorked ? `${attendance.hoursWorked}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {attendance.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={() => handleEditAttendance(attendance)}
                            >
                              <FaEdit />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Attendance Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {currentAttendance?.id ? 'Modifica Presenza' : 'Nuova Presenza'}
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dipendente
                      </label>
                      <select
                        value={currentAttendance?.employeeId || ''}
                        onChange={(e) => setCurrentAttendance({
                          ...currentAttendance,
                          employeeId: Number(e.target.value)
                        })}
                        className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Seleziona dipendente</option>
                        {(employees || []).map(employee => (
                          <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data
                      </label>
                      <input
                        type="date"
                        value={currentAttendance?.date || ''}
                        onChange={(e) => setCurrentAttendance({
                          ...currentAttendance,
                          date: e.target.value
                        })}
                        className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stato
                      </label>
                      <select
                        value={currentAttendance?.status || 'present'}
                        onChange={(e) => setCurrentAttendance({
                          ...currentAttendance,
                          status: e.target.value as 'present' | 'absent' | 'late' | 'leave'
                        })}
                        className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="present">Presente</option>
                        <option value="absent">Assente</option>
                        <option value="late">In ritardo</option>
                        <option value="leave">In permesso</option>
                      </select>
                    </div>
                    
                    {(currentAttendance?.status === 'present' || currentAttendance?.status === 'late') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Orario Entrata
                          </label>
                          <input
                            type="time"
                            value={currentAttendance?.checkIn || ''}
                            onChange={(e) => setCurrentAttendance({
                              ...currentAttendance,
                              checkIn: e.target.value
                            })}
                            className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Orario Uscita
                          </label>
                          <input
                            type="time"
                            value={currentAttendance?.checkOut || ''}
                            onChange={(e) => setCurrentAttendance({
                              ...currentAttendance,
                              checkOut: e.target.value
                            })}
                            className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Note
                      </label>
                      <textarea
                        value={currentAttendance?.notes || ''}
                        onChange={(e) => setCurrentAttendance({
                          ...currentAttendance,
                          notes: e.target.value
                        })}
                        rows={3}
                        className="mt-1 block w-full p-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      onClick={handleSaveAttendance}
                    >
                      Salva
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Layout>
  );
}