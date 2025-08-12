import React from 'react'

export default function Navbar({ dark, setDark }) {
  return (
    <header className="backdrop-blur-sm sticky top-4 z-30 py-3 px-4">
      <div className="container-max flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md transform transition-transform duration-300 hover:scale-105">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v9l3-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">Personal Cloud AI</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Secure · Fast · Smart</div>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="px-3 py-2 rounded-md hover:scale-[1.03] transition transform focus-ring"
            aria-label="Toggle dark mode"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
          <a className="px-4 py-2 rounded-md bg-primary-500 text-white font-medium hover:bg-primary-600 transition" href="#">
            Dashboard
          </a>
        </nav>
      </div>
    </header>
  )
}
