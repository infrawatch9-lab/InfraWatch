import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const flags = {
  pt: (
    <svg viewBox="0 0 60 60" width="40" height="40" className="rounded-full">
      <circle cx="30" cy="30" r="30" fill="#006600" />
      <rect x="0" y="0" width="24" height="60" fill="#FF0000" />
      <circle cx="18" cy="30" r="8" fill="#FFCC00" stroke="#000" strokeWidth="1" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 60" width="40" height="40" className="rounded-full">
      <clipPath id="us-clip"><circle cx="30" cy="30" r="30" /></clipPath>
      <g clipPath="url(#us-clip)">
        <rect width="60" height="60" fill="#b22234" />
        {[...Array(13)].map((_, i) => (
          <rect key={i} y={i * 60 / 13} width="60" height="2.3" fill="#fff" opacity={i % 2 === 1 ? 1 : 0} />
        ))}
        <rect width="25" height="25" fill="#3c3b6e" />
        {/* Simplified stars */}
        {[...Array(9)].map((_, row) =>
          [...Array(row % 2 === 0 ? 6 : 5)].map((_, col) => (
            <circle key={row + '-' + col} cx={4 + col * 4.2 + (row % 2 === 0 ? 0 : 2.1)} cy={3 + row * 2.7} r="0.7" fill="#fff" />
          ))
        )}
      </g>
    </svg>
  )
};

const languages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = languages.find(l => l.code === i18n.language) || languages[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-100 focus:outline-none min-w-0 p-0 overflow-hidden"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white">{flags[current.code]}</span>
      </button>
      <div className={`absolute z-10 mb-2 bottom-full left-1/2 -translate-x-1/2 w-16 transition-all duration-200 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`} style={{transformOrigin: 'bottom center'}}>
        {open && (
          <ul className="bg-white border border-gray-200 rounded shadow-lg flex flex-col items-center py-2">
            {languages.map(lang => (
              <li
                key={lang.code}
                className={`flex flex-col items-center justify-center w-12 h-16 rounded cursor-pointer hover:bg-blue-50 transition-colors ${lang.code === current.code ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleSelect(lang.code)}
                role="option"
                aria-selected={lang.code === current.code}
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white mb-1">{flags[lang.code]}</span>
                <span className="text-xs font-semibold text-gray-700">{lang.code.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
