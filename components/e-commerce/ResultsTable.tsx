'use client';

import React, { useState } from 'react';
import { ProductItem } from '@/lib/e-commerce/types';
import { CheckCircle, XCircle, Clock, Eye, FileText, Sparkles, X } from 'lucide-react';

interface Props {
  items: ProductItem[];
}

export const ResultsTable: React.FC<Props> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);

  // Determine main display column (usually Name or Title if it exists, else the second column)
  const getDisplayTitle = (item: ProductItem) => {
    const keys = Object.keys(item.attributes);
    // Try to find a key that looks like a name
    const nameKey = keys.find(k => /name|title|название|товар/i.test(k));
    if (nameKey) return item.attributes[nameKey];
    // Fallback to the second attribute (since first is often ID)
    if (keys.length > 1) return item.attributes[keys[1]];
    // Fallback to first
    return item.attributes[keys[0]] || 'Unknown Item';
  };

  return (
    <>
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No data available. Upload an HTML file to begin.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                      {item.status === 'error' && <XCircle className="text-red-500" size={20} />}
                      {item.status === 'pending' && <Clock className="text-blue-500 animate-pulse" size={20} />}
                      {item.status === 'idle' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{getDisplayTitle(item)}</span>
                            <span className="text-xs text-gray-500">ID: {item.rowId}</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(item.attributes).slice(0, 3).map(([k, v]) => (
                                    <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {k}: {String(v).substring(0, 20)}{String(v).length > 20 ? '...' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Eye size={16} className="mr-1" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-5 pb-4 sm:p-6 flex justify-between items-start z-10">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Details: {getDisplayTitle(selectedItem)}
              </h3>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 pb-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                    <FileText size={14} className="mr-2"/> Input Attributes
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full">
                      <tbody>
                        {Object.entries(selectedItem.attributes).map(([key, value]) => (
                          <tr key={key} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 pr-2 text-xs font-bold text-gray-600 align-top w-1/3">{key}</td>
                            <td className="py-2 text-xs text-gray-800 align-top">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                    <Sparkles size={14} className="mr-2 text-purple-500"/> AI Result
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-xs overflow-y-auto max-h-[60vh]">
                    {selectedItem.generatedDescription ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedItem.generatedDescription }} />
                    ) : selectedItem.errorMessage ? (
                      <span className="text-red-600 font-bold">Error: {selectedItem.errorMessage}</span>
                    ) : (
                      <span className="text-gray-400 italic">Pending generation...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end">
              <button 
                type="button" 
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


