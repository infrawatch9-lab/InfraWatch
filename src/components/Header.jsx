import React, { useState } from 'react'
import { Radar, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/30 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link
            to="/"
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-900 transition text-white px-4 py-2 rounded-full"
          >
            <Radar className="w-6 h-6" />
            <span className="text-lg font-bold">InfraWatch</span>
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link
              to="/dashboard"
              className="uppercase text-blue-800 hover:text-blue-950 font-semibold transition"
            >
              Dashboard
            </Link>
            <Link
              to="/reports"
              className="uppercase text-blue-800 hover:text-blue-950 font-semibold transition"
            >
              Relatórios
            </Link>
            <Link
              to="/users"
              className="uppercase text-blue-800 hover:text-blue-950 font-semibold transition"
            >
              Perfil
            </Link>
          </nav>

          <button
            className="md:hidden text-blue-800 hover:text-blue-950"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/90 backdrop-blur-md shadow-md rounded-b-xl overflow-hidden"
          >
            <div className="flex flex-col divide-y divide-gray-200 px-6 py-4">
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-blue-800 hover:text-blue-900 font-semibold text-base transition"
              >
                Dashboard
              </Link>
              <Link
                to="/reports"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-blue-800 hover:text-blue-900 font-semibold text-base transition"
              >
                Relatórios
              </Link>
              <Link
                to="/users"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-blue-800 hover:text-blue-900 font-semibold text-base transition"
              >
                Perfil
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
