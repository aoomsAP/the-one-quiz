require("dotenv").config();
import express from "express";
import { connect } from "./db";
import { User, Favorite, Blacklist, Question, Movie, Character } from "./types";
import { characters} from "./characters";
import { movies } from "./movies";
import { quotes } from "./quotes";
import { ObjectId } from "mongodb";
import { mockUser } from "./mockData";

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (typeof(process.env.API_KEY) === "undefined") throw Error(`Error: .env var "API_KEY" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const API_KEY = process.env.API_KEY; // API_KEY in .env file

let user: User|null = null;

app.get("/", (req, res) => {
    // e.g. http://localhost:3000/
    res.render("index");
})

app.post("/login", (req, res) => {
    // e.g. http://localhost:3000/login
 
    res.render("login");
})

app.get("/register", (req, res) => {
    // e.g. http://localhost:3000/register
    res.render("register");
})

app.get("/user/:userId/quiz", (req, res) => {
    // e.g. http://localhost:3000/user/1/quiz
    res.render("quiz");
})

app.get("/user/:userId/quiz/:type/question/:questionId", (req, res) => {
    // e.g. http://localhost:3000/user/1/quiz/10rounds/question/1
    res.render("question");
})

app.get("/user/:userId/quiz/:type/score", (req, res) => {
    // e.g. http://localhost:3000/user/1/quiz/10rounds/score
    res.render("score");
})

app.get("/user/:userId/favorites", (req, res) => {
    // e.g. http://localhost:3000/user/1/favorites
    res.render("favorites");
})

app.get("/user/:userId/favorites/:characterId", (req, res) => {
    // e.g. http://localhost:3000/user/1/favorites/28392
    res.render("character");
})

app.get("/user/:userId/blacklist", (req, res) => {
    // e.g. http://localhost:3000/user/1/blacklist
    res.render("blacklist");
})

app.use((req, res) => {
    res.status(404);
    res.send("Error 404 - Page Not Found");
})

app.listen(app.get("port"), async () => {
    console.log(`Local url: htpp://localhost:${app.get("port")}`);

    try {
        await connect();
    } catch (e) {
        console.log("Error: MongoDB connection failed.");
    }
})