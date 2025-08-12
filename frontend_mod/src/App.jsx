import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Upload from './components/Upload'
import Footer from './components/Footer'

export default function App() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-900 transition-colors duration-500">
      <Navbar dark={dark} setDark={setDark} />
      <main className="container-max py-12 sm:py-16">
        <section className="mb-12 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800/60 card-bg rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Personal Cloud AI</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              Upload files, manage them, and interact with AI — now with a smooth modern UI powered by Tailwind CSS.
            </p>
          </div>
        </section>

        <section className="animate-fadeIn" style={{animationDelay: '80ms'}}>
          <Upload />
        </section>
      </main>

      <Footer />
    </div>
  )
}
