import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    try {
      const res = await fetch("https://personal-cloud-ai.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Signup failed");
      alert("Signup successful! Please log in.");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <form onSubmit={handleSignup} className="bg-white shadow p-6 rounded max-w-sm mx-auto space-y-3">
      <h2 className="text-lg font-bold">Sign Up</h2>
      <input
        className="border p-2 w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 w-full"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="bg-green-500 text-white p-2 w-full rounded">
        Sign Up
      </button>
    </form>
  );
}
