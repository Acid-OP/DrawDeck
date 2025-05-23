import  express  from "express";
import { middelware } from "./middelware";
import {signupSchema} from "@repo/common/types";
const app = express();
app.use(express.json());


app.post("/api/v1/signup" , (req,res)=> {

    const data = signupSchema.safeParse(req.body);
    if(!data.success) {
        res.status(400).json({message : "Invalid input " , error:data.error});
    }
    return;
})

app.post("api/v1/signin")

app.post("/api/v1/room" , (req ,res) => {

})

app.listen(3002);