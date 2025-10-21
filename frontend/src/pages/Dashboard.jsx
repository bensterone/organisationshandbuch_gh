import React from 'react';
import NavigationTree from '../components/navigation/NavigationTree';
import NewProcessButton from '../components/navigation/NewProcessButton';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Documents</h3>
          <p className="text-3xl font-bold text-primary-600">127</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Processes</h3>
          <p className="text-3xl font-bold text-primary-600">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Files</h3>
          <p className="text-3xl font-bold text-primary-600">542</p>
        </div>
      </div>
      <NewProcessButton />
      <NavigationTree />
    </div>
  );
};

export default Dashboard;