import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { BellIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              HR Management System
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            {status === 'authenticated' ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={session.user?.image || '/default-avatar.png'} 
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;