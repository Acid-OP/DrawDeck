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
      shapes.map((s) => {
        const { id, type, ...rest } = s;
        return prismaClient.shape.upsert({
          where: { id },
          update: {
            data: rest,
            updatedAt: new Date(),
          },
          create: {
            id,
            roomId,
            userId: req.userId!,
            type,
            data: rest,
          },
        });
      })
    );

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("❌ Failed to save shapes", e);
    res.status(500).json({ message: "Failed to add shapes" });
  }
});


app.delete("/shapes/:shapeId", middelware, async (req, res) => {
  const shapeIdParam = req.params.shapeId;
  if (!shapeIdParam) {
    res.status(400).json({ message: "No shape ID provided" });
    return;
  }

  // Allow single or comma-separated multiple IDs
  const shapeIds = shapeIdParam.split(",");

  try {
    await prismaClient.shape.deleteMany({
      where: {
        id: {
          in: shapeIds,
        },
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete shape(s):", err);
    res.status(500).json({ message: "Failed to delete shape(s)" });
  }
});



app.post("/shapes/delete", middelware, async (req, res) => {
  const { shapeIds } = req.body;

  if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
    res.status(400).json({ message: "shapeIds must be a non-empty array" });
    return;
  }

  try {
    await prismaClient.shape.deleteMany({
      where: {
        id: {
          in: shapeIds,
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Batch delete failed", err);
    res.status(500).json({ message: "Failed to delete shapes" });
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