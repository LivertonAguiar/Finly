import React, { useState, useEffect } from 'react';
import { EMOJI_GROUPS } from '../../utils/defaultCategories';
import { Smile, Search } from 'lucide-react';

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmoji, onSelectEmoji }) => {
  const [activeGroup, setActiveGroup] = useState(EMOJI_GROUPS[0].name);
  const [customEmojiInput, setCustomEmojiInput] = useState(selectedEmoji || '📁');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setCustomEmojiInput(selectedEmoji || '📁');
  }, [selectedEmoji]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomEmojiInput(val);
    if (val.trim()) {
      onSelectEmoji(val.trim());
    }
  };

  const activeEmojis = EMOJI_GROUPS.find(g => g.name === activeGroup)?.emojis || [];

  const filteredEmojis = searchTerm
    ? EMOJI_GROUPS.flatMap(g => g.emojis).filter(emoji => emoji.includes(searchTerm))
    : activeEmojis;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-slate-900/70 space-y-3">
      {/* Custom Emoji Input Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
          <Smile className="w-4 h-4 text-emerald-500 shrink-0" />
          <input
            type="text"
            placeholder="Digite ou cole qualquer emoji (ex: 🚀, 💰, 🏠)..."
            value={customEmojiInput}
            onChange={handleCustomChange}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-sm">
          {selectedEmoji || '📁'}
        </div>
      </div>

      {/* Category Groups */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {EMOJI_GROUPS.map(g => (
          <button
            key={g.name}
            type="button"
            onClick={() => {
              setActiveGroup(g.name);
              setSearchTerm('');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeGroup === g.name && !searchTerm
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Grid of Emojis */}
      <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-44 overflow-y-auto p-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              setCustomEmojiInput(emoji);
            }}
            className={`h-10 text-2xl flex items-center justify-center rounded-xl transition-all hover:scale-125 active:scale-95 ${
              selectedEmoji === emoji
                ? 'bg-emerald-100 dark:bg-emerald-950/80 ring-2 ring-emerald-500 scale-110 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
