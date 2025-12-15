'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { parseHtmlFile } from '@/lib/e-commerce/htmlParser';
import { generateCsv, downloadCsv, parseProgressCsv, parseSourceCsv } from '@/lib/e-commerce/csvHelper';
import { FileUpload } from '@/components/e-commerce/FileUpload';
import { ResultsTable } from '@/components/e-commerce/ResultsTable';
import { ProgressStats } from '@/components/e-commerce/ProgressStats';
import { ErrorLogModal } from '@/components/e-commerce/ErrorLogModal';
import { ProductItem, ProcessingStats, AppError } from '@/lib/e-commerce/types';
import { BATCH_SIZE, BATCH_DELAY, DEFAULT_PROMPT_TEMPLATE, DEFAULT_MODEL, AVAILABLE_MODELS, constructPrompt } from '@/lib/e-commerce/constants';
import { Play, Download, Trash2, FileUp, Sparkles, Settings, X, Edit3, Save, FileText, AlertTriangle } from 'lucide-react';

export default function ECommerceGeneratorPage() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  
  // Error Logging
  const [errorLogs, setErrorLogs] = useState<AppError[]>([]);
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  // Settings
  const [apiKey, setApiKey] = useState(""); 
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [customModel, setCustomModel] = useState(""); 
  const [showSettings, setShowSettings] = useState(false);
  
  // Prompt Configuration
  const [niche, setNiche] = useState("");
  const [role, setRole] = useState("Опытный маркетолог");
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const stats: ProcessingStats = {
    total: items.length,
    processed: items.filter(i => i.status !== 'idle').length,
    success: items.filter(i => i.status === 'success').length,
    failed: items.filter(i => i.status === 'error').length,
  };

  const hasApiKey = !!apiKey.trim();
  const activeModel = customModel.trim() ? customModel.trim() : selectedModel;

  // Helper to add logs
  const addErrorLog = (message: string, item?: ProductItem) => {
    const newError: AppError = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      message: message,
      itemId: item?.rowId,
      itemName: item ? (Object.values(item.attributes)[0] || 'Unknown') : undefined
    };
    setErrorLogs(prev => [...prev, newError]);
  };

  const handleHtmlUpload = useCallback((content: string, fileName?: string) => {
    try {
      const parsedItems = parseHtmlFile(content);
      if (parsedItems.length === 0) {
        const msg = "No valid product data found in HTML.";
        alert(msg);
        addErrorLog(msg);
        return;
      }
      setItems(parsedItems);
      setProcessingIndex(0);
      setErrorLogs([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error parsing HTML";
      alert(msg);
      addErrorLog(msg);
    }
  }, []);

  const handleCsvUpload = useCallback((content: string, fileName?: string) => {
    try {
      const parsedItems = parseSourceCsv(content);
      if (parsedItems.length === 0) {
        const msg = "No valid product rows found in CSV.";
        alert(msg);
        addErrorLog(msg);
        return;
      }
      setItems(parsedItems);
      setProcessingIndex(0);
      setErrorLogs([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error parsing CSV";
      alert(msg);
      addErrorLog(msg);
    }
  }, []);

  const handleProgressUpload = useCallback((content: string) => {
    if (items.length === 0) {
      alert("Please upload the original HTML source file first.");
      return;
    }
    try {
      const processedMap = parseProgressCsv(content);
      setItems(prev => prev.map(item => {
        if (processedMap.has(item.rowId)) {
           return { ...item, status: 'success', generatedDescription: '[Restored from previous run (content not loaded)]' };
        }
        return item;
      }));
    } catch (e) {
      const msg = "Error parsing CSV progress file.";
      alert(msg);
      addErrorLog(msg);
    }
  }, [items.length]);

  const processBatch = async () => {
    // Check stop flag at the very beginning
    if (shouldStop) {
      setIsProcessing(false);
      setShouldStop(false);
      // Reset pending items back to idle
      setItems(prev => prev.map(item => 
        item.status === 'pending' ? { ...item, status: 'idle' } : item
      ));
      return;
    }

    const idleItems = items.filter(i => i.status === 'idle');
    if (idleItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    const batch = idleItems.slice(0, BATCH_SIZE);
    
    // update status to pending
    setItems(prev => prev.map(item => 
      batch.find(b => b.id === item.id) ? { ...item, status: 'pending' } : item
    ));

    const promises = batch.map(async (item) => {
      // Check stop flag before each request
      if (shouldStop) {
        return { id: item.id, status: 'idle' as const, cancelled: true };
      }

      try {
        const finalPrompt = constructPrompt(promptTemplate, niche, role, item.attributes);
        
        // Call our Next.js API route instead of direct OpenRouter call
        const response = await fetch('/api/e-commerce-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            prompt: finalPrompt,
            model: activeModel,
          }),
        });

        // Check stop flag after request
        if (shouldStop) {
          return { id: item.id, status: 'idle' as const, cancelled: true };
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return { id: item.id, status: 'success' as const, result: data.content };
      } catch (error) {
        // Don't process errors if stopped
        if (shouldStop) {
          return { id: item.id, status: 'idle' as const, cancelled: true };
        }
        const errorMsg = String(error);
        addErrorLog(errorMsg, item);
        return { id: item.id, status: 'error' as const, error: errorMsg };
      }
    });

    const results = await Promise.all(promises);

    // Check stop flag before updating items
    if (shouldStop) {
      setIsProcessing(false);
      setShouldStop(false);
      setItems(prev => prev.map(item => {
        const res = results.find(r => r.id === item.id);
        if (res && 'cancelled' in res) {
          return { ...item, status: 'idle' };
        }
        return item;
      }));
      return;
    }

    setItems(prev => prev.map(item => {
      const res = results.find(r => r.id === item.id);
      if (res && 'cancelled' in res) {
        return { ...item, status: 'idle' };
      }
      if (res) {
        return {
          ...item,
          status: res.status,
          generatedDescription: res.status === 'success' ? res.result : null,
          errorMessage: res.status === 'error' ? res.error : undefined
        };
      }
      return item;
    }));

    // Continue to next batch if not stopped
    if (!shouldStop) {
      setTimeout(() => {
        if (!shouldStop) {
          setProcessingIndex(prev => prev + 1);
        }
      }, BATCH_DELAY);
    }
  };

  useEffect(() => {
    if (isProcessing && !shouldStop) {
      processBatch();
    } else if (shouldStop) {
      setIsProcessing(false);
      setShouldStop(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, processingIndex, shouldStop]);

  const handleStart = () => {
    if (!hasApiKey) {
        setShowSettings(true);
        addErrorLog("Attempted to start without API Key");
        return;
    }
    // With the new prompt, niche might not be mandatory in the prompt text, but good to ask.
    if (!niche && promptTemplate.includes('{{niche}}')) {
        if(!confirm("Вы не указали нишу (Topic). Использовать стандартную?")) return;
    }
    setShouldStop(false);
    setIsProcessing(true);
  };

  const handleStop = () => {
    setShouldStop(true);
    setIsProcessing(false);
    // Immediately reset pending items
    setItems(prev => prev.map(item => 
      item.status === 'pending' ? { ...item, status: 'idle' } : item
    ));
  };

  const handleExport = () => {
    const csvContent = generateCsv(items);
    downloadCsv(csvContent, 'ecommerce_products_ai.csv');
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will clear all data.")) {
      setItems([]);
      setIsProcessing(false);
      setShouldStop(false);
      setErrorLogs([]);
    }
  };

  // UI Components for Modals
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowSettings(false)}></div>
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-5 pb-4 sm:p-6 flex justify-between items-start z-10">
                <h3 className="text-lg leading-6 font-medium text-gray-900">App Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-500"><X size={20} /></button>
            </div>
            
            <div className="px-4 pb-4 sm:p-6 sm:pb-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OpenRouter API Key</label>
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-md shadow-sm p-2.5 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                            placeholder="sk-or-..." 
                            autoFocus
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Required. Get one at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-600 underline">openrouter.ai</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select AI Model</label>
                        <div className="relative">
                            <select 
                                value={selectedModel} 
                                onChange={(e) => {
                                    setSelectedModel(e.target.value);
                                    setCustomModel(""); 
                                }}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                {AVAILABLE_MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                                <option value="custom">Custom Model ID...</option>
                            </select>
                        </div>
                    </div>

                    {(selectedModel === 'custom' || customModel) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Model ID</label>
                            <input 
                                type="text" 
                                value={customModel} 
                                onChange={(e) => setCustomModel(e.target.value)}
                                placeholder="e.g. google/gemini-pro-1.5"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm bg-gray-50" 
                            />
                        </div>
                    )}
                    
                    <div className="pt-2 text-xs text-gray-500 border-t border-gray-100">
                        Current Active Model: <span className="font-mono font-bold text-gray-700">{activeModel}</span>
                    </div>
                </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end">
                <button 
                    type="button" 
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:text-sm"
                    onClick={() => setShowSettings(false)}
                >
                    Done
                </button>
            </div>
        </div>
    </div>
  );

  const PromptEditorModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPromptEditor(false)}></div>
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-5 pb-4 sm:p-6 flex justify-between items-start z-10">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Edit3 size={18} className="mr-2"/> Customize Prompt
                </h3>
                <button onClick={() => setShowPromptEditor(false)} className="text-gray-400 hover:text-gray-500"><X size={20} /></button>
            </div>
            <div className="px-4 pb-4 sm:p-6 sm:pb-4">
                <p className="text-sm text-gray-500 mb-3">
                    Use <code>{`{{niche}}`}</code>, <code>{`{{role}}`}</code>, and <code>{`{{attributes}}`}</code> as placeholders.
                    The system will inject the product data automatically.
                </p>
                <textarea 
                    value={promptTemplate} 
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    className="w-full h-80 border border-gray-300 rounded-md shadow-sm p-3 font-mono text-sm focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="mt-2 text-right">
                     <button onClick={() => setPromptTemplate(DEFAULT_PROMPT_TEMPLATE)} className="text-xs text-blue-600 hover:underline">Reset to Default</button>
                </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end">
                <button type="button" className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 sm:text-sm"
                    onClick={() => setShowPromptEditor(false)}>
                    <Save size={16} className="mr-2"/> Save Prompt
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      {showSettings && <SettingsModal />}
      {showPromptEditor && <PromptEditorModal />}
      {showErrorLogs && <ErrorLogModal errors={errorLogs} onClose={() => setShowErrorLogs(false)} onClear={() => setErrorLogs([])} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
               <Sparkles size={18} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">E-commerce Generator</h1>
                <p className="text-xs text-gray-500">
                    Model: {AVAILABLE_MODELS.find(m => m.id === activeModel)?.name.split('(')[0] || activeModel}
                </p>
             </div>
          </div>
          <div className="flex items-center space-x-4">
             <button
                onClick={() => setShowErrorLogs(true)}
                className={`relative p-2 rounded-md transition-colors ${errorLogs.length > 0 ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-gray-600'}`}
                title="View Error Logs"
             >
                <AlertTriangle size={20} />
                {errorLogs.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-600 transform translate-x-1/4 -translate-y-1/4"></span>
                )}
             </button>
             
             <button 
                onClick={() => setShowSettings(true)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!hasApiKey ? 'bg-amber-100 text-amber-700 animate-pulse' : 'text-gray-600 hover:bg-gray-100'}`}
             >
                <Settings size={18} />
                <span>{!hasApiKey ? 'Set API Key' : 'Settings'}</span>
             </button>
             {items.length > 0 && (
                <button 
                    onClick={handleReset} 
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    title="Reset All"
                >
                    <Trash2 size={20} />
                </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        {items.length === 0 ? (
          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex flex-col">
                 <h2 className="text-center text-xl font-bold text-gray-900 mb-4">Option A: HTML Table</h2>
                 <FileUpload 
                    label="Upload HTML Source" 
                    subLabel="File containing <table> (e.g. from Pandas)"
                    accept=".html" 
                    onFileLoaded={handleHtmlUpload} 
                 />
             </div>
             <div className="flex flex-col">
                 <h2 className="text-center text-xl font-bold text-gray-900 mb-4">Option B: CSV File</h2>
                 <FileUpload 
                    label="Upload CSV Source" 
                    subLabel="Standard CSV or raw data"
                    accept=".csv" 
                    onFileLoaded={handleCsvUpload} 
                 />
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Prompt Configuration Panel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Edit3 size={18} className="mr-2 text-indigo-500"/> Context & Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Topic</label>
                        <input 
                            type="text" 
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="e.g. Car Parts, Women's Fashion"
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">Used in <code>{`{{niche}}`}</code> placeholder</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role / Persona</label>
                        <input 
                            type="text" 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. SEO Copywriter"
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                         <p className="mt-1 text-xs text-gray-400">Used in <code>{`{{role}}`}</code> placeholder</p>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={() => setShowPromptEditor(true)}
                            className="w-full flex items-center justify-center px-4 py-2 border border-indigo-300 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                        >
                            <FileText size={18} className="mr-2" />
                            View / Edit Prompt
                        </button>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-20 z-10">
               <div className="flex items-center space-x-4">
                 {!isProcessing ? (
                   <button 
                     onClick={handleStart}
                     disabled={stats.processed === stats.total}
                     className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                   >
                     <Play size={18} />
                     <span>Generate Descriptions ({stats.total - stats.processed})</span>
                   </button>
                 ) : (
                   <button 
                     onClick={handleStop}
                     className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                   >
                     Stop Processing
                   </button>
                 )}
               </div>

               <div className="flex items-center space-x-4">
                 <div className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                        <FileUp size={18} />
                        <span>Resume (CSV)</span>
                    </button>
                    <input 
                        type="file" 
                        accept=".csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                 const reader = new FileReader();
                                 reader.onload = (ev) => handleProgressUpload(ev.target?.result as string);
                                 reader.readAsText(file);
                             }
                        }}
                    />
                 </div>

                 <button 
                   onClick={handleExport}
                   disabled={stats.processed === 0}
                   className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                 >
                   <Download size={18} />
                   <span>Download CSV</span>
                 </button>
               </div>
            </div>

            <ProgressStats stats={stats} />
            <ResultsTable items={items} />
          </div>
        )}
      </main>
    </div>
  );
}

