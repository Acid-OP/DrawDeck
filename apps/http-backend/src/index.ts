import  express  from "express";
import { middelware } from "./middelware";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/index";
import jwt from "jsonwebtoken";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup" , async (req,res)=> {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.json({
            message : "Incorrect inputs"
        })
        return;
    }
    try{
        const user = await prismaClient.user.create({
        data: {
            email : parsedData.data?.username,
            password: parsedData.data.password,
            name : parsedData.data.name
        }
    })
    res.status(200).json({
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

    res.status(200).json({
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
    const userId = req.userId;
    try{
        const room = await prismaClient.room.create({
        data : {
            slug : parsedData.data.name,
            adminId: userId
        }
    })
    res.status(200).json({
        roomId : room.id
    })
    }catch(e){
        res.status(411).json({
            message: " Room already exist with this name"
        })
    }
})

app.post("/shapes/:roomId", middelware, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const shapes = req.body.shapes;

  if (!Array.isArray(shapes)) {
    res.status(400).json({ message: "Shapes must be an array" });
    return;
  }
 try {
    await Promise.all(
      shapes.map(s =>
        prismaClient.shape.create({
          data: {
            id: typeof s.id === "string" ? s.id : undefined,
            roomId,
            userId: req.userId!,
            type: s.type,             
            data: s,                      
          },
        }),
      ),
    );

    res.status(200).json({ success: true });
  }catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to add shapes" });
  }
});

app.delete("/shapes/:shapeId", middelware, async (req, res) => {
  const shapeId = req.params.shapeId; 
  try {
    await prismaClient.shape.delete({
      where: { id: shapeId },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "failed to delete shape" });
  }
});

app.get("/shapes/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  try {
    const shapes = await prismaClient.shape.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
    });

    const transformedShapes = shapes.map((shape) => {
      const shapeData =
        typeof shape.data === "object" && shape.data !== null && !Array.isArray(shape.data)
        ? (shape.data as Record<string, any>)
        : {};
      return {
        id: shape.id,
        roomId: shape.roomId,
        userId: shape.userId,
        type: shape.type,
        ...shapeData,
      };
    });
    res.status(200).json({ shapes: transformedShapes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch shapes" });
  }
});

app.get("/room/:slug" , async (req,res)=> {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where:{
            slug
        }
    });
    if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
    }
    res.status(200).json({
        room
    })
})
app.listen(3002);