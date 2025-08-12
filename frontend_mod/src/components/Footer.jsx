import React from 'react'

export default function Footer() {
  return (
    <footer className="py-8">
      <div className="container-max text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Personal Cloud AI — Built with ♥ using Tailwind CSS
      </div>
    </footer>
  )
}
