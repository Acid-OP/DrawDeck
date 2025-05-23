import  express  from "express";
import { middelware } from "./middelware";
import {CreateUserSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client";
const app = express();
app.use(express.json());


app.post("/api/v1/signup" , async (req,res)=> {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.json({
            message : "Incorrect inputs"
        })
        return;
    }
    try{
        prismaClient.user.create({
        data: {
            email : parsedData.data.username,
            password: parsedData.data.password,
            name : parsedData.data.name
        }
    })
    res.json({
        userId : "123"
    }) 
    }catch(e){
        res.status(411).json({
            message: "User already exists with this email"
        })
    }
  
})

app.post("api/v1/signin" , (req,res)=>{
    
})

app.post("/api/v1/room" , (req ,res) => {

})

app.listen(3002);