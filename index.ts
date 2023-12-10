// DEPENDENCIES
// ------------------------------------------------------------------------------------------------------

require("dotenv").config();
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import fs from "fs";
const bcrypt = require('bcrypt');

import { User, Favorite, Blacklist, Movie, Character } from "./types";
import { ObjectId } from "mongodb";
import { client, connect, createUser, getUser, getUserById, getUserByEmail, createNewHighScore, addToFavorites, addToBlacklist, deleteFavorite, deleteBlacklist, editBlacklist, clearQuestions, writeCharacterAnswer, writeMovieAnswer } from "./db";
import { addNextQuestion, getCharacterAnswerById, getMovieAnswerById } from "./functions";
import { loadCharacters, loadMovies, loadQuotes } from "./API";

// SETUP APP + SESSIONS
// ------------------------------------------------------------------------------------------------------

const app = express();
app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    store: MongoStore.create({
        client,
        dbName: "TheOneQuiz",
        collectionName: "Sessions"
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
}));

declare module 'express-session' {
    export interface SessionData {
        userId: ObjectId;
    }
}

// ROUTES
// ------------------------------------------------------------------------------------------------------

// LANDING

app.get("/", async (req, res) => {
    try {
        let user: User | null = null;
        if (req.session.userId) {
            user = await getUserById(req.session.userId);
        }

        res.render("index", {
            user: user,
        });

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Oeps, er is iets fout gegaan. Probeer het later opnieuw."
        });
    }
})

// LOGIN

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
    try {
        let username: string = req.body.username;
        let password: string = req.body.password;
        let foundUser: User | null = await getUser(username);

        // validate login
        if (!foundUser) {
            return res.render("login", {
                message: "Sorry, de ingevoerde gebruikersnaam en/of wachtwoord is niet correct. Probeer het opnieuw."
            });
        }

        let validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword) {
            return res.render("login", {
                message: "Sorry, de ingevoerde gebruikersnaam en/of wachtwoord is niet correct. Probeer het opnieuw."
            });
        }

        // create session
        req.session.userId = foundUser._id;
        req.session.save(() => res.status(200).redirect("/"));

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Oeps, er is iets fout gegaan. Probeer het later opnieuw."
        });
    }

});

// LOGOUT

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect("/");
    });
})

// REGISTER

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", async (req, res) => {
    try {
        let username: string = req.body.username;
        let password: string = req.body.password;
        let confirmPassword: string = req.body.confirmPassword;
        let email: string = req.body.email;

        // check if username already exists in db
        let foundUserById: User | null = await getUser(username);
        if (foundUserById) {
            return res.render("register", {
                message: "Gebruikersnaam en/of email is al in gebruik."
            });
        }

        // check if email address already exists in db
        let foundUserByEmail: User | null = await getUserByEmail(email);
        if (foundUserByEmail) {
            return res.render("register", {
                message: "Gebruikersnaam en/of email is al in gebruik."
            });
        }

        // check if passwords are the same
        if (password !== confirmPassword) {
            return res.render("register", {
                message: "De ingevoerde wachtwoorden komen niet overeen. Probeer het opnieuw."
            });
        }

        // create new user
        let newUser: User = {
            username: username,
            password: await bcrypt.hash(password, 10),
            email: email,
            questions: [],
            favorites: [],
            blacklist: [],
            highscore_tenrounds: 0,
            highscore_suddendeath: 0
        }
        await createUser(newUser);

        // load new user from db
        let newUserInDb: User | null = await getUser(newUser.username);
        if (!newUserInDb) {
            throw "Could not find user";
        }
        else {
            req.session.userId = newUserInDb._id;
            return req.session.save(() => res.status(200).redirect("/"));
        }

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Oeps, er is iets fout gegaan. Probeer het later opnieuw."
        });
    }
})

// QUIZ

app.get("/quiz", (req, res) => {
    res.render("quiz");
})

app.post("/quiz", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        // clear previous questions array, start fresh
        await clearQuestions(req.session.userId);

        // add first question to questions array
        await addNextQuestion(user);

        // go to first question of the chosen type of quiz
        const typeOfQuiz: string = req.body.typeOfQuiz;
        res.redirect(`/quiz/${typeOfQuiz}/question/0`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// QUESTION

app.get("/quiz/:type/question/:questionId", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const typeOfQuiz: string = req.params.type;
        const typeOfQuizTitle: string = typeOfQuiz === "tenrounds" ? "Ten Rounds" : "Sudden Death";
        const questionId: number = parseInt(req.params.questionId);
        const favorite: Favorite | undefined = user.favorites.find(fav => fav.quote_id === user.questions[questionId].quote_id);
        let inFavorite: boolean = false;
        if (favorite) {
            inFavorite = true;
        }

        res.render("question", {
            typeOfQuiz: typeOfQuiz,
            typeOfQuizTitle: typeOfQuizTitle,
            questionId: questionId,
            question: user.questions[questionId],
            inFavorite: inFavorite
        });

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/quiz/:type/question/:questionId", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const questionId: number = parseInt(req.params.questionId);
        const typeOfQuiz: string = req.params.type;
        const characterAnswerId = req.body.btnradioChar;
        const movieAnswerId = req.body.btnradioMovie;
        const comment: string = req.body.blacklistComment;

        const characterIsCorrect = characterAnswerId === user.questions[questionId].correct_character.character_id;
        const movieIsCorrect = movieAnswerId === user.questions[questionId].correct_movie.movie_id;

        // write answers to question array
        const characterAnswer: Character = getCharacterAnswerById(characterAnswerId, user.questions[questionId]);
        await writeCharacterAnswer(req.session.userId, user.questions[questionId].quote_id, characterAnswer);
        const movieAnswer: Movie = getMovieAnswerById(movieAnswerId, user.questions[questionId]);
        await writeMovieAnswer(req.session.userId, user.questions[questionId].quote_id, movieAnswer);

        //Handle thumbs up & thumbs down functionality
        const favorite: Favorite | undefined = user.favorites.find(fav => fav.quote_id === user.questions[questionId].quote_id);
        if (req.body.btnThumbs === "thumbsUp") {

            await addToFavorites(user,
                {
                    quote_id: user.questions[questionId].quote_id,
                    dialog: user.questions[questionId].dialog,
                    character: user.questions[questionId].correct_character
                });
        }
        else if (req.body.btnThumbs === "thumbsDown") {

            if (favorite) {
                await deleteFavorite(user, favorite);

            }

            await addToBlacklist(user,
                {
                    quote_id: user.questions[questionId].quote_id,
                    dialog: user.questions[questionId].dialog,
                    comment: comment
                });
        }
        else {
            if (favorite) {
                await deleteFavorite(user, favorite);
            }
        }

        // check if end of quiz: redirect to score
        switch (typeOfQuiz) {
            case "tenrounds":
                // ten rounds ends after 10 questions
                if (questionId >= 9) {
                    return res.redirect(`/quiz/${typeOfQuiz}/score`,);
                }
                break;

            case "suddendeath":
                // sudden death ends when answer is wrong
                if (!characterIsCorrect || !movieIsCorrect) {
                    return res.redirect(`/quiz/${typeOfQuiz}/score`,);
                }
                break;
        }

        // default action: generate the next question
        await addNextQuestion(user);

        // default redirect: go to the next question
        res.redirect(`/quiz/${typeOfQuiz}/question/${questionId + 1}`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// SCORE

app.get("/quiz/:type/score", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        let user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const typeOfQuiz = req.params.type;
        let scores: number[] = [];
        let highScore: number = 0;

        switch (typeOfQuiz) {
            case "tenrounds":
                scores = user.questions.map(q => {
                    if (q.correct_character.character_id === q.answer_character?.character_id
                        && q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 1;
                    } else if (q.correct_character.character_id === q.answer_character?.character_id
                        || q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 0.5;
                    } else {
                        return 0;
                    }
                });
                highScore = user.highscore_tenrounds;
                break;
            case "suddendeath":
                scores = user.questions.map(q => {
                    if (q.correct_character.character_id === q.answer_character?.character_id
                        && q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                highScore = user.highscore_suddendeath;
                break;
            default:
                break;
        }

        let sumOfScores: number = scores.reduce((prev, curr) => prev + curr, 0);

        const newHighScore: boolean = highScore < sumOfScores;
        if (newHighScore) {
            await createNewHighScore(user, typeOfQuiz, sumOfScores);
            user = await getUserById(req.session.userId);
            if (!user) {
                throw "Could not find user in db";
            }
            highScore = typeOfQuiz === "tenrounds" ? user.highscore_tenrounds : user.highscore_suddendeath;
        }

        res.render("score", {
            typeOfQuiz: typeOfQuiz,
            questions: user.questions,
            score: sumOfScores,
            highScore: highScore,
            newHighScore: newHighScore
        });

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
});

// FAVORITES

app.get("/favorites", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        res.render("favorites", {
            favorites: user.favorites
        });
    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }

});

app.get("/favorites/download", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const favList: string = user.favorites.reduce((favList: string, fav: Favorite) => {
            return favList + `${fav.dialog} - ${fav.character.name}\r\n`;
        }, "");

        fs.writeFileSync(`${user.username}_favorites.txt`, favList, "utf8");

        res.download(`${user.username}_favorites.txt`, () => {
            fs.unlink(`${user.username}_favorites.txt`, (error) => {
                if (error) console.log(error);
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
});

app.post("/favorites/:quoteId/delete", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const quoteId: string = req.params.quoteId;

        let favorite: Favorite | undefined = user.favorites.find(fav => fav.quote_id === quoteId);

        if (favorite) {
            await deleteFavorite(user, favorite);
            res.redirect(`/favorites`);
        }

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// CHARACTER

app.get("/favorites/:characterId", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const characterId: string = req.params.characterId;

        let characterQuotes: Favorite[] = user.favorites.filter(fav => fav.character.character_id === characterId);

        if (characterQuotes.length > 0) {
            let foundCharacter: Character | undefined = characterQuotes.find(fav => fav.character.character_id === characterId)?.character;

            if (foundCharacter) {
                res.render("character", {
                    character: foundCharacter,
                    characterQuotes: characterQuotes
                });
            }
        } else {
            res.redirect("/favorites");
        }

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/favorites/:characterId/:quoteId/delete", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const quoteId: string = req.params.quoteId;
        const characterId: string = req.params.characterId;

        if (user.favorites) {
            let favorite: Favorite | undefined = user.favorites.find(fav => fav.quote_id === quoteId);

            if (favorite) {
                await deleteFavorite(user, favorite);
                res.redirect(`/favorites/${characterId}`);
            }
        }

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// BLACKLIST

app.get("/blacklist", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const blacklist: Blacklist[] = user.blacklist;
        res.render("blacklist", { blacklist: blacklist });

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/blacklist/:quoteId/delete", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const quoteId = req.params.quoteId;
        await deleteBlacklist(user, quoteId);
        res.redirect("/blacklist");

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/blacklist/:quoteId/edit", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const quoteId = req.params.quoteId;
        const newComment = req.body.editComment;
        await editBlacklist(user, quoteId, newComment);

        res.redirect("/blacklist");
    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// PAGE NOT FOUND

app.use((req, res) => {
    res.status(404);
    res.render("error-page", {
        errorMessage: "Pagina niet gevonden."
    });
})

// PORT + CONNECTIONS
// ------------------------------------------------------------------------------------------------------

app.listen(app.get("port"), async () => {
    console.log(`Local url: http://localhost:${app.get("port")}`);

    try {
        await connect();
    } catch (e) {
        console.log("Error: MongoDB connection failed.");
    }

    try {
        await loadCharacters();
        await loadQuotes();
        await loadMovies();
    } catch (err) {
        console.log(err);
    }
})