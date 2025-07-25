import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";

export default async function HomePage() {
  // Fix: await the headers
  const headersList = await headers();
  const cookies = headersList.get('cookie');
  
  console.log("🍪 Raw cookies:", cookies);
  
  const { userId, sessionId, sessionClaims } = await auth();
  const user = await currentUser();
  
  console.log("✅ Auth result:", { userId, sessionId, sessionClaims });
  console.log("✅ Current user:", user);
  
  if (!userId) {
    return (
      <div>
        <h1>Debug Info</h1>
        <p>No user signed in</p>
        <p>Cookies: {cookies ? "Present" : "None"}</p>
        <pre>{JSON.stringify({ userId, sessionId }, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName ?? "User"}!</h1>
      <p>Your ID: {userId}</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}