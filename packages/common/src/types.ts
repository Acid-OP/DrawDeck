import {z} from "zod";
export const signupSchema = z.object({
    username: z
      .string()
      .min(3,"Username must be at least 3 charecters")
      .max(50,"Username must be 50 charecters or less")
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/ , "Username must start with letter and contain only letters , numbers"),
    password: z
      .string()
      .min(8, "Password must be at least 8 charectors")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/ , "Password must contain at least one number")
      .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)"),
})