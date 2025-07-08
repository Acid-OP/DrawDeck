'use client';
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URL}/signin`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      router.push("/create-room");
    } catch (err) {
      alert("Login failed. Check console.");
      console.error(err);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl mb-4">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="border p-2 w-full" placeholder="Email" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-green-600 text-white px-4 py-2" type="submit">Login</button>
      </form>
    </div>
  );
}
