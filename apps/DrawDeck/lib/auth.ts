// import NextAuth from "next-auth"
// import GoogleProvider from "next-auth/providers/google"

// declare module "next-auth" {
//   interface Session {
//     accessToken?: string
//   }
// }

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     })
//   ],
//   session: {
//     strategy: "jwt",
//     maxAge: 30 * 24 * 60 * 60, 
//   },
//   callbacks: {
//     async jwt({ token, account }) {
//       if (account) {
//         token.accessToken = account.access_token
//         token.refreshToken = account.refresh_token
//       }
//       return token
//     },
//     async session({ session, token }) {
//       session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined
//       return session
//     },
//   },
// })
