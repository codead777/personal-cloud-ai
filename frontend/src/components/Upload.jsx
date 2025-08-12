import React, { useState } from 'react'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleUpload = () => {
    if (!file) return
    // Implement actual upload logic using your backend API
    alert('Pretend uploading: ' + file.name)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800/60 card-bg rounded-2xl shadow-md p-6 sm:p-8 transition-transform duration-400 hover:scale-[1.01]">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center animate-subtleSpin">
              <svg className="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 5v7l3-2"></path>
                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"></path>
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold">Upload files</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select files. Supports most common formats.</p>

            <div
              onDrop={handleDrop}
              onDragOver={(e)=>{ e.preventDefault(); setDragActive(true) }}
              onDragLeave={(e)=>{ e.preventDefault(); setDragActive(false) }}
              className={`mt-4 rounded-xl border-2 ${dragActive ? 'border-primary-500 bg-primary-50/30' : 'border-dashed border-gray-200 bg-gray-50 dark:bg-gray-700'} p-6 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200`}
            >
              <label className="flex items-center gap-4 cursor-pointer flex-1">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 4v8"></path>
                  <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M8 8l4-4 4 4"></path>
                </svg>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {file ? <span className="font-medium">{file.name}</span> : 'Click to select or drop a file here'}
                  <div className="text-xs text-gray-400">Max 100MB</div>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                >
                  Upload
                </button>
                <button
                  onClick={() => setFile(null)}
                  className="px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:shadow-sm transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>Accepted: PDF, TXT, DOCX, PNG, JPG</div>
              <div className="text-right">Encrypted in transit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
