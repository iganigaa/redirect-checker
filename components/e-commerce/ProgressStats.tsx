'use client';

import React from 'react';
import { ProcessingStats } from '@/lib/e-commerce/types';

interface Props {
  stats: ProcessingStats;
}

export const ProgressStats: React.FC<Props> = ({ stats }) => {
  const percentage = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Processing Progress</h2>
        <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600">Processed</div>
          <div className="text-xl font-bold text-blue-700">{stats.processed}</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600">Success</div>
          <div className="text-xl font-bold text-green-700">{stats.success}</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-sm text-red-600">Failed</div>
          <div className="text-xl font-bold text-red-700">{stats.failed}</div>
        </div>
      </div>
    </div>
  );
};









