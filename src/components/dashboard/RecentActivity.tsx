import React from 'react';
import { ClockIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const activities = [
  {
    id: 1,
    type: 'check-in',
    user: 'Marco Rossi',
    time: '08:30 AM',
    date: 'Today',
    icon: ClockIcon,
    color: 'text-green-500',
  },
  {
    id: 2,
    type: 'new-employee',
    user: 'Laura Bianchi',
    time: 'Yesterday',
    date: 'Dec 12',
    icon: UserIcon,
    color: 'text-blue-500',
  },
  {
    id: 3,
    type: 'payroll',
    user: 'December Payroll',
    time: '2 days ago',
    date: 'Dec 11',
    icon: CurrencyDollarIcon,
    color: 'text-purple-500',
  },
];

const RecentActivity = () => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.color} bg-opacity-10`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {activity.user}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time>{activity.time}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;