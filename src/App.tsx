/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnalyticsProvider, useAnalytics } from './context/AnalyticsContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { UploadData } from './pages/UploadData';
import { Analysis } from './pages/Analysis';
import { Predictions } from './pages/Predictions';
import { Evaluation } from './pages/Evaluation';
import { Schema } from './pages/Schema';
import { About } from './pages/About';

const MainContent: React.FC = () => {
  const { activeTab } = useAnalytics();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadData />;
      case 'analysis':
        return <Analysis />;
      case 'predictions':
        return <Predictions />;
      case 'evaluation':
        return <Evaluation />;
      case 'schema':
        return <Schema />;
      case 'about':
        return <About />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Responsive Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AnalyticsProvider>
      <MainContent />
    </AnalyticsProvider>
  );
}
