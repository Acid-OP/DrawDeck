import  express  from "express";
import {z} from "zod";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { error } from "zod/v4/locales/ar.js";
import { middelware } from "./middelware";
const app = express();
app.use(express.json());

const signupSchema = z.object({
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
// @ts-ignore
app.post("/api/v1/signup" , async(req,res)=> {
    const username = req.body.username;
    const password = req.body.password;

    const valid = signupSchema.safeParse({username,password});
    if(!valid.success) {
        return res.status(400).json({message : "Invalid input " , error:valid.error});
    }

    try{
        const salt = 10;
        const hashedPassword = await bcrypt.hash(password , salt);
    }catch(e){
        res.status(409).json({message : "error"})
    }
})

app.post("api/v1/signin")

app.post("/api/v1/room" , middelware , (req ,res) => {

})

app.listen(3002);