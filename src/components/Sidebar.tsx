import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const router = useRouter();
  
  const isActive = (path: string) => {
    return router.pathname === path;
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Dipendenti', path: '/employees', icon: UserGroupIcon },
    { name: 'Turni', path: '/shifts', icon: CalendarIcon },
    { name: 'Presenze', path: '/attendance', icon: ClockIcon },
    { name: 'Statistiche', path: '/stats', icon: ChartBarIcon },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800 dark:bg-gray-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h2 className="text-lg font-bold text-white">Gestione Dipendenti</h2>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? 'bg-gray-900 dark:bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive(item.path)
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
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
}