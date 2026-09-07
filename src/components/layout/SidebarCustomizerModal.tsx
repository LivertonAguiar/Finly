import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  RotateCcw,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Search,
} from 'lucide-react';
import {
  ALL_SIDEBAR_ITEMS,
  DEFAULT_SIDEBAR_ORDER,
  getStoredSidebarItems,
  saveStoredSidebarItems,
  getSidebarItemLabel,
  SidebarItemDef,
} from '../../utils/sidebarConfig';
import { useTranslation } from '../../utils/i18n';
import { useBackButton } from '../../hooks/useBackButton';

interface SidebarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsChange?: (items: string[]) => void;
}

export const SidebarCustomizerModal: React.FC<SidebarCustomizerModalProps> = ({
  isOpen,
  onClose,
  onItemsChange,
}) => {
  useBackButton(isOpen, onClose);
  const { lang, t } = useTranslation();
  const [activeItems, setActiveItems] = useState<string[]>(getStoredSidebarItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemsRef = useRef<string[]>(activeItems);
  activeItemsRef.current = activeItems;

  const dragIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveItems(getStoredSidebarItems());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleItem = (id: string) => {
    // Keep at least dashboard or at least 1 item
    if (activeItems.includes(id)) {
      if (activeItems.length <= 1) return;
      const updated = activeItems.filter(item => item !== id);
      setActiveItems(updated);
      saveStoredSidebarItems(updated);
      onItemsChange?.(updated);
    } else {
      const updated = [...activeItems, id];
      setActiveItems(updated);
      saveStoredSidebarItems(updated);
      onItemsChange?.(updated);
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;

    const reordered = [...activeItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setActiveItems(reordered);
    saveStoredSidebarItems(reordered);
    onItemsChange?.(reordered);
  };

  // Global safety listener to release drag if released anywhere
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        handleEndDrag();
      }
    };
    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, []);

  // Touch and Pointer Drag and Drop
  const handleStartDrag = (index: number, clientY: number) => {
    if (searchTerm) return;
    dragIndexRef.current = index;
    isDraggingRef.current = true;
    setDraggedIndex(index);
    if (navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  const handleMoveDrag = (clientY: number) => {
    if (!isDraggingRef.current || dragIndexRef.current === null || !listRef.current) return;

    // Auto-scroll modal container if near edges
    if (scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const threshold = 60;
      if (clientY < containerRect.top + threshold) {
        scrollContainerRef.current.scrollTop -= 8;
      } else if (clientY > containerRect.bottom - threshold) {
        scrollContainerRef.current.scrollTop += 8;
      }
    }

    // Find hover index by inspecting children rects
    const children = Array.from(listRef.current.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const currentIndex = dragIndexRef.current;
        if (currentIndex !== null && currentIndex !== i) {
          const currentList = [...activeItemsRef.current];
          const [moved] = currentList.splice(currentIndex, 1);
          currentList.splice(i, 0, moved);

          dragIndexRef.current = i;
          setDraggedIndex(i);
          setActiveItems(currentList);
          if (navigator.vibrate) {
            try {
              navigator.vibrate(12);
            } catch {}
          }
        }
        break;
      }
    }
  };

  const handleEndDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    dragIndexRef.current = null;
    setDraggedIndex(null);

    saveStoredSidebarItems(activeItemsRef.current);
    onItemsChange?.(activeItemsRef.current);
  };

  const handleResetToDefault = () => {
    setActiveItems(DEFAULT_SIDEBAR_ORDER);
    saveStoredSidebarItems(DEFAULT_SIDEBAR_ORDER);
    onItemsChange?.(DEFAULT_SIDEBAR_ORDER);
  };

  const itemMap = new Map(ALL_SIDEBAR_ITEMS.map(item => [item.id, item]));

  // Active items in custom order
  const activeDefList = activeItems
    .map(id => itemMap.get(id))
    .filter((item): item is SidebarItemDef => !!item);

  // Inactive available items
  const inactiveDefList = ALL_SIDEBAR_ITEMS.filter(item => !activeItems.includes(item.id));

  // Search filter
  const filteredActive = activeDefList.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInactive = inactiveDefList.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Personalizar Menu Lateral
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha os itens ativos e arraste para definir a ordem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="px-5 pt-4">
          <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-300">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>Sem duplicidade:</strong> Os itens adicionados à barra lateral saem automaticamente de <em>"Mais opções"</em>. Itens desmarcados ficam acessíveis em <em>"Mais opções"</em>.
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar itens e funcionalidades..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="p-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Section 1: Active in Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span>Ativos na Barra Lateral</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                  {activeItems.length} itens
                </span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Arraste pelo ícone de mover ou use as setas
              </span>
            </div>

            <div ref={listRef} className="space-y-2">
              {filteredActive.map((item, index) => {
                const Icon = item.icon;
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={item.id}
                    data-index={index}
                    className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 select-none ${
                      isDragging
                        ? 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/50 shadow-lg shadow-purple-500/10 scale-[1.01] z-20 ring-2 ring-purple-500/30'
                        : 'bg-white dark:bg-[#202023] border-slate-200 dark:border-slate-800 hover:border-purple-500/50 shadow-xs'
                    }`}
                  >
                    {/* Left: Drag Handle + Checkbox + Icon + Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {!searchTerm && (
                        <div
                          onPointerDown={e => {
                            if (e.button !== 0) return;
                            try {
                              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                            } catch {}
                            handleStartDrag(index, e.clientY);
                          }}
                          onPointerMove={e => {
                            if (isDraggingRef.current) {
                              handleMoveDrag(e.clientY);
                            }
                          }}
                          onPointerUp={e => {
                            try {
                              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                            } catch {}
                            handleEndDrag();
                          }}
                          onPointerCancel={e => {
                            try {
                              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                            } catch {}
                            handleEndDrag();
                          }}
                          onTouchStart={e => {
                            handleStartDrag(index, e.touches[0].clientY);
                          }}
                          onTouchMove={e => {
                            if (isDraggingRef.current) {
                              if (e.cancelable) e.preventDefault();
                              handleMoveDrag(e.touches[0].clientY);
                            }
                          }}
                          onTouchEnd={handleEndDrag}
                          onTouchCancel={handleEndDrag}
                          style={{ touchAction: 'none' }}
                          className={`p-2 -my-2 -ml-2 rounded-xl transition-all shrink-0 flex items-center justify-center touch-none select-none ${
                            isDragging
                              ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 cursor-grabbing scale-110'
                              : 'text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing'
                          }`}
                          title="Toque e arraste para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                        title="Desmarcar (Mover para Mais Opções)"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {getSidebarItemLabel(item.id, lang)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {/* Right: Order Arrows */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0 || !!searchTerm}
                        onClick={() => handleMoveItem(index, 'up')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === activeItems.length - 1 || !!searchTerm}
                        onClick={() => handleMoveItem(index, 'down')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Inactive (Available under "Mais Opções") */}
          {filteredInactive.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>{t('more.title', 'Mais opções')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                    {filteredInactive.length} itens
                  </span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Marque para fixar na barra lateral
                </span>
              </div>

              <div className="space-y-2">
                {filteredInactive.map(item => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-[#1A1A1D] border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 hover:bg-white dark:hover:bg-[#222226] transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-400 group-hover:border-purple-500 flex items-center justify-center shrink-0 transition-colors" />

                        <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white block truncate">
                            {getSidebarItemLabel(item.id, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        + Adicionar
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#141416]">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('action.restore_default', 'Restaurar Padrão')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            {t('action.save', 'Concluir')}
          </button>
        </div>
      </div>
    </div>
  );
};
