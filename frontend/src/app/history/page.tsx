'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HistoryItem } from '@/components/history/HistoryItem';
import { HistoryChatPanel } from '@/components/history/HistoryChatPanel';
import { DeleteHistoryModal } from '@/components/history/DeleteHistoryModal';
import { INITIAL_HISTORY, HistoryItem as HistoryItemType } from '@/lib/mock-data';
import { History, FolderSearch } from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItemType[]>([]);
  const router = useRouter();

  // Selected item displayed on the right-side chat panel
  const [selectedItem, setSelectedItem] = useState<HistoryItemType | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItemType | null>(null);

  // Load history on mount
  useEffect(() => {
    const historyData = localStorage.getItem('satquery_history_db');
    if (historyData) {
      try {
        const parsed: HistoryItemType[] = JSON.parse(historyData);
        setHistoryItems(parsed);
        if (parsed.length > 0) {
          setSelectedItem(parsed[0]); // Default select the first item on desktop
        }
      } catch (e) {
        console.error("Failed to parse history data", e);
        setHistoryItems(INITIAL_HISTORY);
        setSelectedItem(INITIAL_HISTORY[0]);
        localStorage.setItem('satquery_history_db', JSON.stringify(INITIAL_HISTORY));
      }
    } else {
      // Seed default data if none exists
      setHistoryItems(INITIAL_HISTORY);
      setSelectedItem(INITIAL_HISTORY[0]);
      localStorage.setItem('satquery_history_db', JSON.stringify(INITIAL_HISTORY));
    }
  }, []);

  const handleSelectItem = (item: HistoryItemType) => {
    setSelectedItem(item);
  };

  const handleOpenInDashboard = (item: HistoryItemType) => {
    sessionStorage.setItem('satquery_active_history_item', JSON.stringify(item));
    router.push('/dashboard');
  };

  const handleDeleteRequest = (item: HistoryItemType) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const updated = historyItems.filter(item => item.id !== itemToDelete.id);
    setHistoryItems(updated);
    localStorage.setItem('satquery_history_db', JSON.stringify(updated));
    setDeleteModalOpen(false);

    if (selectedItem?.id === itemToDelete.id) {
      setSelectedItem(updated.length > 0 ? updated[0] : null);
    }
    setItemToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1640px] w-full mx-auto space-y-6">
      
      {/* Header titles */}
      <div className="text-left space-y-1">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
          <History size={24} className="text-emerald-400" />
          Analysis History
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium">
          Select an observation record from the left list to inspect the full session in the right panel.
        </p>
      </div>

      {/* Master-Detail Split Screen Layout */}
      {historyItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: List of History Items */}
          <div className={selectedItem ? "lg:col-span-5 space-y-3.5" : "lg:col-span-12 max-w-4xl mx-auto w-full space-y-3.5"}>
            <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              <span>Saved Missions ({historyItems.length})</span>
              <span>Select to view details</span>
            </div>

            <div className="space-y-3.5">
              {historyItems.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={handleSelectItem}
                  onOpenInDashboard={handleOpenInDashboard}
                  onDeleteRequest={handleDeleteRequest}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Open Chat Inspection Panel */}
          {selectedItem && (
            <div className="lg:col-span-7 sticky top-20">
              <HistoryChatPanel
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onOpenInDashboard={handleOpenInDashboard}
                onDeleteRequest={handleDeleteRequest}
              />
            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center space-y-5 rounded-2xl bg-[#111827]/75 backdrop-blur-xl border border-white/10 max-w-xl mx-auto shadow-2xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shadow-inner">
            <FolderSearch size={26} />
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-white">No Analysis Records</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You haven't conducted any imagery queries yet. Start analyzing to compile historical reports.
            </p>
          </div>
          <div className="pt-2">
            <ClayButton variant="emerald" onClick={() => router.push('/dashboard')} className="text-xs py-2.5 px-5 rounded-xl font-bold shadow-md">
              New Query Session
            </ClayButton>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {itemToDelete && (
        <DeleteHistoryModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          querySummary={itemToDelete.query}
        />
      )}
    </div>
  );
}
