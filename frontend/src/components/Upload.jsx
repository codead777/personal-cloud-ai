import React, { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    // Upload logic here
    console.log("Uploading:", file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div
        className="w-full max-w-lg p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg
                   transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-xl"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Upload Your File
        </h1>

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed 
                     border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer 
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                     transition-colors duration-300 ease-in-out group"
        >
          <svg
            className="w-12 h-12 mb-2 text-gray-500 group-hover:text-indigo-500 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
          <span className="text-gray-500 dark:text-gray-300 group-hover:text-indigo-500 transition-colors">
            Click to select a file
          </span>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {file && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center animate-fadeIn">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file}
          className="mt-6 w-full py-3 px-6 bg-indigo-600 text-white font-semibold 
                     rounded-xl shadow-md hover:bg-indigo-700 active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 ease-in-out"
        >
          Upload
        </button>
      </div>
    </div>
  );
}

