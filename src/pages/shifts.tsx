import { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parseISO, startOfWeek, getDay, addHours, startOfMonth, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Layout from '@/components/Layout';
import moment from 'moment';
import 'moment/locale/it';

// Set moment locale to Italian
moment.locale('it');

// Use the built-in momentLocalizer instead of custom localizer
const localizer = momentLocalizer(moment);

// Shift types with colors
const SHIFT_TYPES = {
  morning: { title: 'Mattina', color: '#4CAF50' },
  afternoon: { title: 'Pomeriggio', color: '#2196F3' },
  night: { title: 'Notte', color: '#9C27B0' },
  holiday: { title: 'Festivo', color: '#F44336' },
};

interface Employee {
  id: number;
  name: string;
  department: string;
}

interface Shift {
  id: number;
  title: string;
  start: Date;
  end: Date;
  employeeId: number;
  employeeName: string;
  shiftType: keyof typeof SHIFT_TYPES;
  notes?: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<number | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<Partial<Shift> | null>(null);
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Fetch shifts and employees data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [shiftsRes, employeesRes] = await Promise.all([
          fetch('/api/shifts'),
          fetch('/api/employees')
        ]);

        if (shiftsRes.ok && employeesRes.ok) {
          const shiftsData = await shiftsRes.json();
          const employeesData = await employeesRes.json();
          
          // Convert string dates to Date objects
          const formattedShifts = shiftsData.map((shift: any) => ({
            ...shift,
            start: new Date(shift.start),
            end: new Date(shift.end),
          }));
          
          setShifts(formattedShifts);
          setEmployees(employeesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter shifts based on selected employee and department
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const employeeMatch = selectedEmployee === 'all' || shift.employeeId === selectedEmployee;
      
      if (selectedDepartment === 'all') return employeeMatch;
      
      const employee = employees.find(e => e.id === shift.employeeId);
      return employeeMatch && employee?.department === selectedDepartment;
    });
  }, [shifts, selectedEmployee, selectedDepartment, employees]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  }, [employees]);

  // Handle slot selection (creating a new shift)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setCurrentShift({
      start,
      end,
      shiftType: 'morning',
    });
    setIsModalOpen(true);
  };

  // Handle event selection (editing an existing shift)
  const handleSelectEvent = (shift: Shift) => {
    setCurrentShift(shift);
    setIsModalOpen(true);
  };

  // Save shift (create or update)
  const handleSaveShift = async () => {
    if (!currentShift || !currentShift.employeeId || !currentShift.shiftType) return;
    
    try {
      const employee = employees.find(e => e.id === currentShift.employeeId);
      
      const shiftData = {
        ...currentShift,
        title: `${SHIFT_TYPES[currentShift.shiftType as keyof typeof SHIFT_TYPES].title} - ${employee?.name || ''}`,
        employeeName: employee?.name || '',
      };
      
      const method = currentShift.id ? 'PUT' : 'POST';
      const url = currentShift.id ? `/api/shifts/${currentShift.id}` : '/api/shifts';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData),
      });
      
      if (response.ok) {
        const savedShift = await response.json();
        
        if (method === 'PUT') {
          setShifts(shifts.map(s => s.id === savedShift.id ? {
            ...savedShift,
            start: new Date(savedShift.start),
            end: new Date(savedShift.end),
          } : s));
        } else {
          setShifts([...shifts, {
            ...savedShift,
            start: new Date(savedShift.start),
            end: new Date(savedShift.end),
          }]);
        }
        
        setIsModalOpen(false);
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (!currentShift?.id) return;
    
    try {
      const response = await fetch(`/api/shifts/${currentShift.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShifts(shifts.filter(s => s.id !== currentShift.id));
        setIsModalOpen(false);
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  // Custom event styling
  const eventStyleGetter = (event: Shift) => {
    const style = {
      backgroundColor: SHIFT_TYPES[event.shiftType]?.color || '#3174ad',
      borderRadius: '4px',
      color: '#fff',
      border: 'none',
      display: 'block',
    };
    return { style };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione Turni</h1>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tutti i dipendenti</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tutti i reparti</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  setCurrentShift({
                    start: new Date(),
                    end: addHours(new Date(), 8),
                    shiftType: 'morning',
                  });
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Nuovo Turno
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <p className="text-gray-500 dark:text-gray-400">Caricamento turni...</p>
            </div>
          ) : (
            <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <Calendar
                localizer={localizer}
                events={filteredShifts}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                dayPropGetter={(date: Date) => {
                  const isWeekend = getDay(date) === 0 || getDay(date) === 6;
                  return {
                    style: isWeekend ? { backgroundColor: 'rgba(0,0,0,0.03)' } : {}
                  };
                }}
                formats={{
                  dayFormat: 'ddd DD',
                  timeGutterFormat: 'HH:mm',
                }}
                min={new Date(0, 0, 0, 6, 0, 0)} // Start at 6 AM
                max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Shift Modal */}
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
                    {currentShift?.id ? 'Modifica Turno' : 'Nuovo Turno'}
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dipendente
                      </label>
                      <select
                        value={currentShift?.employeeId || ''}
                        onChange={(e) => setCurrentShift({
                          ...currentShift,
                          employeeId: Number(e.target.value)
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      >
                        <option value="" disabled>Seleziona un dipendente</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tipo di Turno
                      </label>
                      <select
                        value={currentShift?.shiftType || 'morning'}
                        onChange={(e) => setCurrentShift({
                          ...currentShift,
                          shiftType: e.target.value as keyof typeof SHIFT_TYPES
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {Object.entries(SHIFT_TYPES).map(([key, { title }]) => (
                          <option key={key} value={key}>{title}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Data Inizio
                        </label>
                        <input
                          type="datetime-local"
                          value={currentShift?.start ? format(currentShift.start, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setCurrentShift({
                            ...currentShift,
                            start: e.target.value ? parseISO(e.target.value) : new Date()
                          })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Data Fine
                        </label>
                        <input
                          type="datetime-local"
                          value={currentShift?.end ? format(currentShift.end, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setCurrentShift({
                            ...currentShift,
                            end: e.target.value ? parseISO(e.target.value) : new Date()
                          })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Note
                      </label>
                      <textarea
                        value={currentShift?.notes || ''}
                        onChange={(e) => setCurrentShift({
                          ...currentShift,
                          notes: e.target.value
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <div>
                      {currentShift?.id && (
                        <button
                          type="button"
                          onClick={handleDeleteShift}
                          className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveShift}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                      >
                        Salva
                      </button>
                    </div>
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