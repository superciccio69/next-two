import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ThemeProvider } from '@/context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}