import React, { useState } from "react";

export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const backendUrl = "https://personal-cloud-ai.onrender.com"; // <-- change if needed

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${backendUrl}/api/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // token must come from login
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Upload success:", data);
      setStatus("✅ Upload successful!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 text-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold">Upload File</h2>

      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-300
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-500 file:text-white
        hover:file:bg-blue-600"
      />

      <button
        onClick={handleUpload}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full transition duration-200"
      >
        Upload
      </button>

      {status && <p className="text-sm mt-2">{status}</p>}
    </div>
  );
}
