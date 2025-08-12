import React, { useState } from "react";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setStatus("");
    setProgress(0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
      setStatus("");
      setProgress(0);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setStatus("⚠️ Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "https://personal-cloud-ai.onrender.com/upload", true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("✅ File uploaded successfully!");
        setSelectedFile(null);
      } else {
        setStatus("❌ Upload failed.");
      }
    };

    xhr.onerror = () => {
      setStatus("❌ An error occurred during upload.");
    };

    xhr.send(formData);
    setStatus("Uploading...");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div
        className={`w-96 p-6 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out ${
          isDragging ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 bg-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-500 mb-2">Drag & drop a file here</p>
        <p className="text-sm text-gray-400 mb-4">or click to select</p>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="fileUpload"
        />
        <label
          htmlFor="fileUpload"
          className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          Browse File
        </label>
        {selectedFile && (
          <p className="mt-4 text-gray-700">📄 {selectedFile.name}</p>
        )}
      </div>

      {progress > 0 && (
        <div className="w-96 bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-blue-500 h-2 transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      <button
        onClick={handleUpload}
        className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors"
      >
        Upload
      </button>

      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </div>
  );
}
