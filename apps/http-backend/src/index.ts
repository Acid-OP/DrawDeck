import  express  from "express";
import { middelware } from "./middelware";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common";
import jwt from "jsonwebtoken";
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

app.post("/signin" , async (req,res)=>{
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
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room" ,middelware, async (req ,res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message : "Incorrect inputs"
        })
        return;
    }
    // @ts-ignore TODO
    const userId = req.userId;

    try{
            const room = await prismaClient.room.create({
        data : {
            slug : parsedData.data.name,
            adminId: userId
        }
    })

    res.json({
        roomId : room.id
    })
    }catch(e){
        res.status(411).json({
            message: " Room already exist with this name"
        })
    }
})

app.get("/chats/:roomId" , async(req,res)=>{
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
        where: {
            roomId: roomId
        },
        orderBy:{
            id: "desc"
        },
        take:50
    });

    res.json({
        messages
    })
})

app.get("/room/:slug" , async (req,res)=> {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where:{
            slug
        }
    });

    res.json({
        room
    })
})
app.listen(3002);