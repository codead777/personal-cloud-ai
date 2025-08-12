import React, { useState } from "react";

export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://personal-cloud-ai.onrender.com/api/files", {
        method: "POST",
        headers: {
          // note: do NOT set Content-Type for multipart/form-data; browser sets it with boundaries
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setMessage(data.message || "Upload successful");
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err.message || "Upload failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Upload File</h2>
      {message && <div className="mb-3 text-sm text-gray-700">{message}</div>}
      <form onSubmit={handleUpload}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-3"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
