import React, { useState } from 'react';

interface FinlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  useImage?: boolean;
}

export const FinlyLogo: React.FC<FinlyLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  useImage = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { box: 'w-7 h-7 rounded-xl text-sm', text: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-2xl text-base', text: 'text-base' },
    lg: { box: 'w-12 h-12 rounded-[18px] text-xl', text: 'text-xl' },
    xl: { box: 'w-16 h-16 rounded-[22px] text-3xl', text: 'text-3xl' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 min-w-0 select-none ${className}`}>
      {useImage && !imgError ? (
        <div
          className={`${current.box} overflow-hidden rounded-2xl bg-black border border-purple-500/30 shadow-md shadow-purple-600/20 shrink-0 flex items-center justify-center`}
        >
          <img
            src="/finly-logo.png"
            alt="Finly Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`${current.box} bg-gradient-to-tr from-[#6366f1] via-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white font-black shadow-md shadow-purple-600/25 shrink-0 select-none tracking-tighter`}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/5 h-3/5"
          >
            <path
              d="M8 6C8 4.89543 8.89543 4 10 4H24C25.1046 4 26 4.89543 26 6C26 7.10457 25.1046 8 24 8H13V14H22C23.1046 14 24 14.8954 24 16C24 17.1046 23.1046 18 22 18H13V26C13 27.1046 12.1046 28 11 28C9.89543 28 8 26.8954 8 25.7909V6Z"
              fill="currentColor"
            />
            <circle cx="22.5" cy="23.5" r="3.5" fill="#38bdf8" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white truncate ${current.text}`}
          >
            Fin<span className="text-[#7c3aed] dark:text-[#a78bfa]">ly</span>
          </span>
        </div>
      )}
    </div>
  );
};

