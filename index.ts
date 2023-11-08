import express from "express";
import { connect } from "./db";
import { User, Favorite, Blacklist, Question, Movie, Character } from "./types";
import { characters} from "./characters";
import { movies } from "./movies";
import { quotes } from "./quotes";
import { ObjectId } from "mongodb";

const user: User = {
    _id: new ObjectId("123abc"),
    username: "FrodoFan2000",
    password: "123",
    email: "frodo@gmail.com",
    favorites: [
        {
            quote_id: "5cd96e05de30eff6ebccefc1",
            dialog: "Bilbo have you been at the Gaffers homebrew?",
            character: {
                character_id: "5cd99d4bde30eff6ebccfc15",
                name: "Frodo Baggins",
                wikiUrl: "http://lotr.wikia.com//wiki/Frodo_Baggins"
            }
        },
        
    ]
    blacklist: [],
    highscore_tenrounds: 4,
    highscore_suddendeath: 2
}

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    // e.g. http://localhost:3000/
    res.render("index");
})

app.get("/login", (req, res) => {
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