'use client';
import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/signup`, {
        username,
        name,
        password,
      });
      router.push("/signin");
    } catch (err) {
      alert("Signup failed. Check console.");
      console.error(err);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl mb-4">Signup</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input className="border p-2 w-full" placeholder="Email" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-600 text-white px-4 py-2" type="submit">Signup</button>
      </form>
    </div>
  );
}
