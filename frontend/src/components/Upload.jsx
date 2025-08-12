import { useState } from "react";

export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      setMessage("File uploaded successfully!");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleUpload} className="bg-white shadow p-6 rounded max-w-sm mx-auto space-y-3">
      <h2 className="text-lg font-bold">Upload File</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
        Upload
      </button>
      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  );
}
