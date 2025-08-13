import { useEffect, useState } from 'react'
import { uploadFiles, listFiles, deleteFile } from '../services/api'
import FileCard from '../components/FileCard'
import { useNavigate } from 'react-router-dom'

export default function Dashboard(){
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const nav = useNavigate()

  useEffect(()=>{ if (!localStorage.getItem('pc_token')) nav('/login'); else refresh(); }, []);

  async function refresh(){
    const res = await listFiles();
    if (res.files) setFiles(res.files);
  }

  async function onFiles(e){
    const f = e.target.files;
    if (!f || f.length===0) return;
    setUploading(true);
    try {
      await uploadFiles(f);
      await refresh();
    } catch (err) { console.error(err); }
    setUploading(false);
  }

  async function handleDelete(id){
    await deleteFile(id);
    setFiles(fs => fs.filter(x => x._id !== id));
  }

  function logout(){ localStorage.removeItem('pc_token'); nav('/login'); }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Cloud ✨</h1>
          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-white border rounded cursor-pointer">
              <input type="file" multiple className="hidden" onChange={onFiles} />
              Upload
            </label>
            <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
          </div>
        </div>

        {uploading && <div className="mb-4 text-sm text-gray-600">Uploading...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(f => (
            <FileCard key={f._id} file={f} onDelete={()=>handleDelete(f._id)} />
          ))}
        </div>

        {files.length===0 && <div className="mt-8 text-center text-gray-500">No files yet — upload some!</div>}
      </div>
    </div>
  )
}
