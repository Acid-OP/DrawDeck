'use client';
import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@clerk/nextjs';

export default function CustomSignUpCard() {
  const router = useRouter();
  const { signUp, setActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleEmailSignUp = async () => {
    try {
      if (!signUp) return null;
      await signUp.create({
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    try {
      if (!signUp) return null;
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });
      await setActive({ session: result.createdSessionId });
      router.push('/dashboard'); // 👈 redirect after signup
    } catch (err) {
      console.error(err);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!signUp) return null;
    await await signUp.authenticateWithRedirect({
  strategy: "oauth_github",
  redirectUrl: "/sso-callback",           // Where OAuth starts (client route)
  redirectUrlComplete: "/",     // Where user lands after OAuth success
});

  };

  return (
    <div className="w-[400px] bg-white shadow-xl p-6 rounded-xl space-y-4">
      <h2 className="text-xl font-bold text-center">Sign Up</h2>

      {!pendingVerification ? (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            onClick={handleEmailSignUp}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            Continue with Email
          </button>

          <div className="flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <button
            onClick={() => handleOAuth('google')}
            className="bg-red-500 text-white w-full py-2 rounded"
          >
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            className="bg-gray-800 text-white w-full py-2 rounded"
          >
            Continue with GitHub
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            onClick={handleVerify}
            className="bg-green-600 text-white w-full py-2 rounded"
          >
            Verify Email
          </button>
        </>
      )}
    </div>
  );
}
