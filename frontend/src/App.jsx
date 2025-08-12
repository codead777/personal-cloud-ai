import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Upload from "./components/Upload";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [page, setPage] = useState(token ? "upload" : "login");

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setPage("login");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Personal Cloud</h1>
        {token && (
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        )}
      </header>

      <nav className="mb-4 flex gap-4">
        {!token && (
          <>
            <button
              onClick={() => setPage("login")}
              className={`px-3 py-1 rounded ${page === "login" ? "bg-blue-500 text-white" : "bg-white border"}`}
            >
              Login
            </button>
            <button
              onClick={() => setPage("signup")}
              className={`px-3 py-1 rounded ${page === "signup" ? "bg-green-500 text-white" : "bg-white border"}`}
            >
              Signup
            </button>
          </>
        )}
        {token && (
          <button
            onClick={() => setPage("upload")}
            className={`px-3 py-1 rounded ${page === "upload" ? "bg-blue-500 text-white" : "bg-white border"}`}
          >
            Upload
          </button>
        )}
      </nav>

      <main>
        {page === "login" && <Login onLogin={(t) => { setToken(t); setPage("upload"); }} />}
        {page === "signup" && <Signup />}
        {page === "upload" && token && <Upload token={token} />}
      </main>
    </div>
  );
}
