require("dotenv").config();
import express from "express";
import { connect } from "./db";
import { User, Favorite, Blacklist, Question, Quote, Movie, Character } from "./types";
import { ObjectId } from "mongodb";
import { mockUser, mockQuotes, mockMovies, mockCharacters, mockQuestions } from "./mockData";

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (typeof(process.env.API_KEY) === "undefined") throw Error(`Error: .env var "API_KEY" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const API_KEY = process.env.API_KEY; // API_KEY in .env file

let user: User|null = null;

let activeUser: User|null = mockUser; // TEMPORARY: testing quiz/score functionality requires an active user

let quotes: Quote[] = mockQuotes; // TODO: replace with empty array and then fill in with loadData function in app.listen
let characters: Character[] = mockCharacters; // TODO: replace with empty array and then fill in with loadData function in app.listen
let movies: Movie[] = mockMovies; // TODO: replace with empty array and then fill in with loadData function in app.listen

let questions: Question[] = mockQuestions; // TODO: replace with empty array and then fill in with generateQuestions function in /quiz/:type/question/:questionId route

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

    const quoteAppearsInBlacklist = (quoteId: string) => {
        if (activeUser === null) { // TODO: replace with "user"
            return res.status(404).send("User not found.");
        }
        else {
            const blacklistedIds : string[] = activeUser.blacklist.map(q => q.quote_id); // TODO: replace with "user"
            return blacklistedIds.includes(quoteId);
        }
    }

    const quoteAlreadyInQuotes = (quoteId: string) => {
        const quoteIds: string[] = quotes.map(q => q.quote_id);
        return quoteIds.includes(quoteId);
    }

    const getQuote = () => {
        let quote: Quote;
        do {
            let randomIndex = Math.floor(Math.random() * (quotes.length - 1));
            quote = quotes[randomIndex];
        } while (quoteAppearsInBlacklist(quote.quote_id) || quoteAlreadyInQuotes(quote.quote_id))
        return quote
    }

    const getTwoWrongCharacters = (character_id: string) => {
        const wrongCharacters: Character[] = [];

        let firstChar: Character;
        do {
            let randomIndex = Math.floor(Math.random() * (characters.length - 1));
            firstChar = characters[randomIndex];
        } while (character_id === firstChar.character_id);
        wrongCharacters[0] = firstChar;

        let secondChar: Character;
        do {
            let randomIndex = Math.floor(Math.random() * (characters.length - 1));
            secondChar = characters[randomIndex];
        } while (character_id === secondChar.character_id && firstChar != secondChar);
        wrongCharacters[1] = secondChar;

        return wrongCharacters;
    }

    const getTwoWrongMovies = (movie_id: string) => {
        const wrongMovies: Movie[] = [];

        let firstMovie: Movie;
        do {
            let randomIndex = Math.floor(Math.random() * (movies.length - 1));
            firstMovie = movies[randomIndex];
        } while (movie_id === firstMovie.movie_id);
        wrongMovies[0] = firstMovie;

        let secondMovie: Movie;
        do {
            let randomIndex = Math.floor(Math.random() * (movies.length - 1));
            secondMovie = movies[randomIndex];
        } while (movie_id === secondMovie.movie_id && firstMovie != secondMovie);
        wrongMovies[1] = secondMovie;

        return wrongMovies;
    }

    const generateQuestions = () => {
        for (let i: number = 0; i < 10; i++) {
            let quote: Quote = getQuote();

            let correctCharacter: Character | undefined = characters.find(character => quote.character_id === character.character_id);
            if (correctCharacter === undefined) return res.status(404).send("Character not found.");

            let correctMovie: Movie | undefined = movies.find(movie => quote.movie_id === movie.movie_id);
            if (correctMovie === undefined) return res.status(404).send("Movie not found.");
            
            const newQuestion: Question = {
                quote_id: quote.quote_id,
                dialog: quote.dialog,
                correct_character: correctCharacter,
                wrong_characters: getTwoWrongCharacters(quote.character_id),
                correct_movie: correctMovie,
                wrong_movies: getTwoWrongMovies(quote.movie_id),
            };
            questions.push(newQuestion);
        }
    }

    const questionId: number = parseInt(req.params.questionId);
    if (questionId === 0) {
        questions = [];
        generateQuestions();
    }

    res.render("question");
})

app.post("/quiz/:type/question/:questionId", (req, res) => {
    const questionId: number = parseInt(req.params.questionId);
    const typeOfQuiz: string = req.params.type;

    //

    // TODO: handle thumbs up & thumbs down functionality

    //

    const characterAnswer = req.body.btnradioChar;
    const movieAnswer = req.body.btnradioMovie;
    const characterIsCorrect: boolean = characterAnswer === questions[questionId].correct_character.character_id;
    const movieIsCorrect: boolean = movieAnswer === questions[questionId].correct_movie.movie_id

    const addCharacterAnswerToQuestion = (character_id: string) => {
        if (character_id === questions[questionId].correct_character.character_id) {
            questions[questionId].answer_character = questions[questionId].correct_character;
        }
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
        if (movie_id === questions[questionId].correct_movie.movie_id) {
            questions[questionId].answer_character = questions[questionId].correct_character;
        }
        else {
            if (movie_id === questions[questionId].wrong_movies[0].movie_id) {
                questions[questionId].answer_movie = questions[questionId].wrong_movies[0];
            }
            else {
                questions[questionId].answer_movie = questions[questionId].wrong_movies[1];
            }
        }
    }

    switch (typeOfQuiz) {
        case "tenrounds":
            addCharacterAnswerToQuestion(characterAnswer);
            addMovieAnswerToQuestion(movieAnswer);
            if (questionId === 9) {
                res.render("score", { questions: questions });
            }
            else {
                res.render(`/quiz/${typeOfQuiz}/question/${questionId + 1}`, { question: questions[questionId + 1] })
            }
            break;

        case "suddendeath":
            addCharacterAnswerToQuestion(characterAnswer);
            addMovieAnswerToQuestion(movieAnswer);
            if (!characterIsCorrect || !movieIsCorrect) {
                res.render("score", { questions: questions })
            }
            else {
                res.render(`/quiz/${typeOfQuiz}/question/${questionId + 1}`, { question: questions[questionId + 1] })
            }
            break;
    }
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