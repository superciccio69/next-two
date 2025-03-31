import React from 'react';

const shifts = [
  {
    id: 1,
    employee: 'Giuseppe Verdi',
    role: 'Developer',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    date: 'Today',
  },
  {
    id: 2,
    employee: 'Anna Ferrari',
    role: 'Designer',
    startTime: '10:00 AM',
    endTime: '6:00 PM',
    date: 'Tomorrow',
  },
  {
    id: 3,
    employee: 'Mario Russo',
    role: 'Manager',
    startTime: '8:00 AM',
    endTime: '4:00 PM',
    date: 'Dec 15',
  },
];

const UpcomingShifts = () => {
  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {shifts.map((shift) => (
          <li key={shift.id} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {shift.employee}
                </p>
                <p className="text-sm text-gray-500 truncate">{shift.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{shift.date}</p>
                <p className="text-sm text-gray-500">
                  {shift.startTime} - {shift.endTime}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingShifts;