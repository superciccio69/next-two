import React from 'react';
import Layout from '../../components/layout/Layout';

// Temporary placeholder component until LogViewer is implemented
const LogViewer = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Logs</h2>
      <p className="text-gray-600">Log viewer component to be implemented</p>
    </div>
  );
};

const LogsPage = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <LogViewer />
      </div>
    </Layout>
  );
};

export default LogsPage;