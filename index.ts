require("dotenv").config();
import express from "express";
import { connect, createUser, getUser } from "./db";
import { User, Favorite, Blacklist, Question, Quote, Movie, Character } from "./types";
import { mockUser, mockQuotes, mockMovies, mockCharacters, mockQuestions } from "./mockData";

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (typeof (process.env.API_KEY) === "undefined") throw Error(`Error: .env var "API_KEY" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const API_KEY = process.env.API_KEY; // API_KEY in .env file

let user: User | null = null;

let activeUser: User | null = mockUser; // TEMPORARY: testing quiz/score functionality requires an active user

let quotes: Quote[] = mockQuotes; // TODO: delete mockQuotes & fill in with loadData function in app.listen
let characters: Character[] = mockCharacters; // TODO: delete mockCharacters & fill in with loadData function in app.listen
let movies: Movie[] = mockMovies; // TODO: delete mockMovies & fill in with loadData function in app.listen

let questions: Question[];

app.get("/", (req, res) => {
    // e.g. http://localhost:3000/
    res.render("index");
})

app.get("/login", (req, res) => {
    // e.g. http://localhost:3000/login
    res.render("login");
})

app.post("/login", async (req, res) => {
    // e.g. http://localhost:3000/login

    let username: string = req.body.username;
    let password: string = req.body.password;

    let foundUser: User | null = await getUser(username);

    if (!foundUser) {
        return res.status(401).json({ "error": "The user does not exist or wrong credentials." });
    }
    
    if (foundUser.password === password) {

        user = foundUser;
        return res.status(200).redirect("/");
        
    } else {
        return res.status(401).json({ "error": "The user does not exist or wrong credentials." });
    }
    
})

app.get("/register", (req, res) => {
    // e.g. http://localhost:3000/register

    res.render("register");
})

app.post("/register", async (req, res) => {
    // e.g. http://localhost:3000/register

    let username: string = req.body.username;
    let password: string = req.body.password;
    let email: string = req.body.email;

    let foundUser: User | null = await getUser(username);

    let newUser: User = {
        username: username,
        password: password,
        email: email,
        favorites: [],
        blacklist: [],
        highscore_tenrounds: 0,
        highscore_suddendeath: 0
    }

    if (foundUser) {
        return res.status(409).json({ "error": "User already exists." });
    }

    await createUser(newUser);
    user = newUser;
    return res.status(201).redirect("/");
})

app.get("/user/:userId/quiz", (req, res) => {
    // e.g. http://localhost:3000/user/1/quiz
    res.render("quiz");
})

app.post("/quiz", (req, res) => {

    const quoteAppearsInBlacklist = (quoteId: string) => {
        if (activeUser === null) { // TODO: replace "activeUser" with "user"
            return res.status(404).send("User not found.");
        }
        else {
            const blacklistedIds: string[] = activeUser.blacklist.map(q => q.quote_id); // TODO: replace "activeUser" with "user"
            return blacklistedIds.includes(quoteId);
        }
    }

    const quoteAlreadyInQuestions = (quoteId: string) => {
        const quoteIds: string[] = questions.map(q => q.quote_id);
        return quoteIds.includes(quoteId);
    }

    const getQuote = () => {
        let quote: Quote;
        do {
            let randomIndex = Math.floor(Math.random() * quotes.length);
            quote = quotes[randomIndex];
        } while (quoteAppearsInBlacklist(quote.quote_id) || quoteAlreadyInQuestions(quote.quote_id))
        return quote
    }

    const getTwoWrongCharacters = (character_id: string) => {
        const wrongCharacters: Character[] = [];

        do {
            let randomIndex = Math.floor(Math.random() * characters.length);
            wrongCharacters[0] = characters[randomIndex];
        } while (character_id === wrongCharacters[0].character_id);

        do {
            let randomIndex = Math.floor(Math.random() * characters.length);
            wrongCharacters[1] = characters[randomIndex];
        } while (character_id === wrongCharacters[1].character_id || wrongCharacters[0] === wrongCharacters[1]);

        return wrongCharacters;
    }

    const getTwoWrongMovies = (movie_id: string) => {
        const wrongMovies: Movie[] = [];

        do {
            let randomIndex = Math.floor(Math.random() * movies.length);
            wrongMovies[0] = movies[randomIndex];
        } while (movie_id === wrongMovies[0].movie_id);

        do {
            let randomIndex = Math.floor(Math.random() * movies.length);
            wrongMovies[1] = movies[randomIndex];
        } while (movie_id === wrongMovies[1].movie_id || wrongMovies[0] === wrongMovies[1]);

        return wrongMovies;
    }

    const generateQuestions = () => {
        for (let i: number = 0; i < 10; i++) { // TODO: change count to 200
            let quote: Quote = getQuote();

            let correctCharacter: Character | undefined = characters.find(character => quote.character_id === character.character_id);
            if (correctCharacter === undefined) return res.status(404).send("Character not found.");

            let correctMovie: Movie | undefined = movies.find(movie => quote.movie_id === movie.movie_id);
            if (correctMovie === undefined) return res.status(404).send("Movie not found.");

            const newQuestion: Question = {
                quote_id: quote.quote_id,
                dialog: quote.dialog,
                correct_character: correctCharacter,
                wrong_characters: getTwoWrongCharacters(correctCharacter.character_id),
                correct_movie: correctMovie,
                wrong_movies: getTwoWrongMovies(correctMovie.movie_id),
            };

            questions.push(newQuestion);
        }
    }

    questions = [];
    generateQuestions();

    const typeOfQuiz: string = req.body.typeOfQuiz;
    res.redirect(`/quiz/${typeOfQuiz}/question/0`);
})

app.get("/quiz/:type/question/:questionId", (req, res) => {

    const typeOfQuiz: string = req.params.type;
    const typeOfQuizTitle: string = typeOfQuiz === "tenrounds" ? "Ten Rounds" : "Sudden Death";
    const questionId: number = parseInt(req.params.questionId);

    res.render("question", {
        typeOfQuiz: typeOfQuiz,
        typeOfQuizTitle: typeOfQuizTitle,
        questionId: questionId,
        question: questions[questionId],
    });
})

app.post("/quiz/:type/question/:questionId", (req, res) => {
    //

    // TODO: handle thumbs up & thumbs down functionality

    //

    const questionId: number = parseInt(req.params.questionId);
    const typeOfQuiz: string = req.params.type;
    const characterAnswer = req.body.btnradioChar;
    const movieAnswer = req.body.btnradioMovie;

    const characterIsCorrect = characterAnswer === questions[questionId].correct_character.character_id;
    const movieIsCorrect = movieAnswer === questions[questionId].correct_movie.movie_id

    const addCharacterAnswerToQuestion = (character_id: string) => {
        // if answer is correct, answer = correct_character
        if (character_id === questions[questionId].correct_character.character_id) {
            questions[questionId].answer_character = questions[questionId].correct_character;
        }
        // if answer is incorrect, answer is one of the wrong_characters
        else {
            if (character_id === questions[questionId].wrong_characters[0].character_id) {
                questions[questionId].answer_character = questions[questionId].wrong_characters[0];
            }
            else {
                questions[questionId].answer_character = questions[questionId].wrong_characters[1];
            }
        }
    }

    const addMovieAnswerToQuestion = (movie_id: string) => {
        // if answer is correct, answer = correct_movie
        if (movie_id === questions[questionId].correct_movie.movie_id) {
            questions[questionId].answer_movie = questions[questionId].correct_movie;
        }
        // if answer is incorrect, answer is one of the wrong_movies
        else {
            if (movie_id === questions[questionId].wrong_movies[0].movie_id) {
                questions[questionId].answer_movie = questions[questionId].wrong_movies[0];
            }
            else {
                questions[questionId].answer_movie = questions[questionId].wrong_movies[1];
            }
        }
    }

    // write answers to question array
    addCharacterAnswerToQuestion(characterAnswer);
    addMovieAnswerToQuestion(movieAnswer);

    // if end of quiz: redirect to score
    switch (typeOfQuiz) {
        case "tenrounds":
            // ten rounds ends after 10 questions
            if (questionId === 9) {
                return res.redirect(`/quiz/${typeOfQuiz}/score`,);
            }
            break;

        case "suddendeath":
            // sudden death ends when answer is wrong or when end of questions has been reached
            if (!characterIsCorrect || !movieIsCorrect || questionId === questions.length - 1) {
                return res.redirect(`/quiz/${typeOfQuiz}/score`,);
            }
            break;
    }

    // default redirect: go to next question
    res.redirect(`/quiz/${typeOfQuiz}/question/${questionId + 1}`);
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

function findUser(username: string) {
    throw new Error("Function not implemented.");
}
