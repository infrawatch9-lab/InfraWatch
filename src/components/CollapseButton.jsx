import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function CollapseButton({ isOpen, toggle }) {
  return (
    <button
      onClick={toggle}
      className="bg-white text-[#0B1440] w-8 h-8 flex items-center justify-center rounded-full shadow mx-auto transition-transform hover:scale-105"
    >
      {isOpen ? <ArrowLeft /> : <ArrowRight />}
    </button>
  );
}
