import { API_BASE } from "../api";
export default function FileCard({ file, onDelete }){
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${file.duplicateOf ? 'ring-2 ring-red-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{file.originalName}</div>
          <div className="text-sm text-gray-500">{Math.round((file.size||0)/1024)} KB • {file.mimeType}</div>
        </div>
        <div className="text-right">
          {file.duplicateOf ? <div className="text-xs text-red-600">Duplicate</div> : <div className="text-xs text-green-600">Unique</div>}
          <div className="mt-2 flex gap-2">
            <a href={`${API_BASE}/api/files/view/${file._id}`} target="_blank" rel="noreferrer">View</a>
            <button onClick={onDelete} className="text-sm text-red-600">Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}
