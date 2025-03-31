import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', icon: ChartBarIcon, href: '/dashboard' },
    { name: 'Employees', icon: UserGroupIcon, href: '/employees' },
    { name: 'Attendance', icon: ClockIcon, href: '/attendance' },
    { name: 'Payroll', icon: CurrencyDollarIcon, href: '/payroll' },
    { name: 'Shifts', icon: CalendarIcon, href: '/shifts' },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-2xl font-bold">HR Manager</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;