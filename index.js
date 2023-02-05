import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import usersRouter from "./routes/users.route.js";
import linkRouter from "./routes/link.route.js";

const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(cors());
//mongo connection

const MONGO_URL = process.env.DB;
export const client = new MongoClient(MONGO_URL);
client.connect();
console.log("mongo connected");



app.get("/", function (request, response) {
    response.send("welcome to url shorten api");
});

app.use("/user", usersRouter);
app.use("/link", linkRouter);


app.listen(PORT, () => console.log("app started in PORT", PORT));





