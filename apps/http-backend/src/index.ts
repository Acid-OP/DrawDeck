import  express  from "express";
import { middelware } from "./middelware";
import {CreateUserSchema, SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common";
const app = express();
app.use(express.json());


app.post("/signup" , async (req,res)=> {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success) {
        console.log(parsedData.error)
        res.json({
            message : "Incorrect inputs"
        })
        return;
    }
    try{
        const user = await prismaClient.user.create({
        data: {
            email : parsedData.data?.username,
            // TODO hash the pass
            password: parsedData.data.password,
            name : parsedData.data.name
        }
    })
    res.json({
        userId : user.id
    }) 
    }catch(e){
        res.status(411).json({
            message: "User already exists with this email"
        })
    }
  
})

app.post("api/v1/signin" , async (req,res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }

    // Todo : compare the password with the hased pass
    const user = await prismaClient.user.findFirst({
        where: {
            email : parsedData.data.username,
            password : parsedData.data.password
        }
    })

    if(!user){
        res.status(403).json({
            message : "Not authorized"
        })
        return;
    }
    const token = jwt.sign({
        userId : user.id
    }, JWT_SECRET)
})

app.post("/api/v1/room" , (req ,res) => {

})

app.listen(3002);