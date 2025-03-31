import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';

interface AttendanceRecord {
  id: number;
  date: string;
  hours_worked: number;
  overtime_hours: number;
  leave_type: 'none' | 'vacation' | 'sick' | 'permit' | 'other';
  notes: string;
}

interface AttendanceCalendarProps {
  employeeId: number;
  month: Date;
  onUpdate: () => void;
}

export default function AttendanceCalendar({ employeeId, month, onUpdate }: AttendanceCalendarProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [employeeId, month]);

  const fetchAttendance = async () => {
    try {
      const start = format(startOfMonth(month), 'yyyy-MM-dd');
      const end = format(endOfMonth(month), 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/attendance?employee_id=${employeeId}&start=${start}&end=${end}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceUpdate = async (date: Date, data: Partial<AttendanceRecord>) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          date: formattedDate,
          ...data
        })
      });

      if (!response.ok) throw new Error('Failed to update attendance');
      await fetchAttendance();
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });

  if (loading) {
    return <div className="text-center py-4">Caricamento...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map(day => {
          const record = attendance.find(
            a => a.date === format(day, 'yyyy-MM-dd')
          );
          
          return (
            <div
              key={day.toString()}
              className="bg-white p-2 min-h-[100px] relative"
            >
              <div className="text-sm">{format(day, 'd')}</div>
              {record && (
                <div className="mt-1 space-y-1">
                  <div className="text-sm">
                    Ore: {record.hours_worked + record.overtime_hours}
                  </div>
                  {record.leave_type !== 'none' && (
                    <div className="text-xs text-gray-500 capitalize">
                      {record.leave_type}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  // Qui implementare il modal per la modifica
                }}
                className="absolute bottom-1 right-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}