// DEPENDENCIES
// ------------------------------------------------------------------------------------------------------

require("dotenv").config();
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import fs from "fs";
const bcrypt = require('bcrypt');

import { User, Favorite, Movie, Character } from "./types";
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
        secure: false
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

        // validate username
        let foundUser: User | null = await getUser(username);
        if (!foundUser) {
            return res.render("login", {
                message: "Sorry, de ingevoerde gebruikersnaam en/of wachtwoord is niet correct. Probeer het opnieuw."
            });
        }

        // validate password
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

app.get("/lotr", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        res.render("quiz");

    } catch (err) {
        console.log(err);
        // res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }

})

app.post("/lotr", async (req, res) => {
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
        res.redirect(`/lotr/quiz/${typeOfQuiz}/question/0`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// QUESTION

app.get("/lotr/quiz/:type/question/:questionId", async (req, res) => {
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

        // if quote is already in favorites, favorites button will be green upon page load
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

app.post("/lotr/quiz/:type/question/:questionId", async (req, res) => {
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

        // check whether answers are correct
        const characterIsCorrect = characterAnswerId === user.questions[questionId].correct_character.character_id;
        const movieIsCorrect = movieAnswerId === user.questions[questionId].correct_movie.movie_id;

        // write answers to question array
        const characterAnswer: Character = getCharacterAnswerById(characterAnswerId, user.questions[questionId]);
        await writeCharacterAnswer(req.session.userId, user.questions[questionId].quote_id, characterAnswer);
        const movieAnswer: Movie = getMovieAnswerById(movieAnswerId, user.questions[questionId]);
        await writeMovieAnswer(req.session.userId, user.questions[questionId].quote_id, movieAnswer);

        // thumbs up & thumbs down functionality
        if (req.body.btnThumbs === "thumbsUp") {
            await addToFavorites(user,
                {
                    quote_id: user.questions[questionId].quote_id,
                    dialog: user.questions[questionId].dialog,
                    character: user.questions[questionId].correct_character
                });
        }
        else if (req.body.btnThumbs === "thumbsDown") {
            // if user wants to blacklist a quote, remove from it favorites first
            // (will simply do nothing if quote is not in favorites)
            await deleteFavorite(user, user.questions[questionId].quote_id);

            await addToBlacklist(user,
                {
                    quote_id: user.questions[questionId].quote_id,
                    dialog: user.questions[questionId].dialog,
                    comment: comment
                });
        }
        else {
            // if both buttons are unchecked, remove quote from favorites
            // (will simply do nothing if quote is not in favorites)
            await deleteFavorite(user, user.questions[questionId].quote_id);
        }

        // check if end of quiz, then redirect to score
        switch (typeOfQuiz) {
            case "tenrounds":
                // "ten rounds" ends after 10 questions
                if (questionId >= 9) {
                    return res.redirect(`/lotr/quiz/${typeOfQuiz}/score`,);
                }
                break;

            case "suddendeath":
                // "sudden death" ends when answer is wrong
                if (!characterIsCorrect || !movieIsCorrect) {
                    return res.redirect(`/lotr/quiz/${typeOfQuiz}/score`,);
                }
                break;
        }

        // default action: generate the next question
        await addNextQuestion(user);

        // default redirect: go to the next question
        res.redirect(`/lotr/quiz/${typeOfQuiz}/question/${questionId + 1}`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// SCORE

app.get("/lotr/quiz/:type/score", async (req, res) => {
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

        // get score for all questions
        switch (typeOfQuiz) {
            case "tenrounds":
                scores = user.questions.map(q => {
                    // if both character and movie answer are correct, return 1 point
                    if (q.correct_character.character_id === q.answer_character?.character_id
                        && q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 1;

                        // if character or movie answer is correct, return 0.5 point
                    } else if (q.correct_character.character_id === q.answer_character?.character_id
                        || q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 0.5;

                        // if neither is correct, return 0 point
                    } else {
                        return 0;
                    }
                });

                // get user highscore for "ten rounds"
                highScore = user.highscore_tenrounds;
                break;
            case "suddendeath":
                scores = user.questions.map(q => {
                    // if both character and movie answer are correct, return 1 point
                    if (q.correct_character.character_id === q.answer_character?.character_id
                        && q.correct_movie.movie_id === q.answer_movie?.movie_id) {
                        return 1;

                        // if anything is wrong, return 0 point
                    } else {
                        return 0;
                    }
                });

                // get user highscore for "sudden death"
                highScore = user.highscore_suddendeath;
                break;
            default:
                break;
        }

        let sumOfScores: number = scores.reduce((prev, curr) => prev + curr, 0);

        // check whether current score is new highscore, if yes add new high score
        const newHighScore: boolean = highScore < sumOfScores;
        if (newHighScore) {
            await createNewHighScore(user, typeOfQuiz, sumOfScores);

            // refresh user data after adding new high score
            user = await getUserById(req.session.userId);
            if (!user) {
                throw "Could not find user in db";
            }

            // refresh high score data after adding new high score
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

app.get("/lotr/favorites", async (req, res) => {
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

app.get("/lotr/favorites/download", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        // create string with favorites data
        const favList: string = user.favorites.reduce((favList: string, fav: Favorite) => {
            return favList + `${fav.dialog} - ${fav.character.name}\r\n`;
        }, "");

        // write favorites file to server
        fs.writeFileSync(`${user.username}_favorites.txt`, favList, "utf8");

        res.download(`${user.username}_favorites.txt`, () => {
            // remove favorites file from server after download
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

app.post("/lotr/favorites/:quoteId/delete", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        // delete from favorites        
        const quoteId: string = req.params.quoteId;
        await deleteFavorite(user, quoteId);

        res.redirect(`/lotr/favorites/`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// CHARACTER

app.get("/lotr/favorites/character/:characterId", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        const characterId: string = req.params.characterId;

        // get all quotes from this character
        let characterQuotes: Favorite[] = user.favorites.filter(fav => fav.character.character_id === characterId);

        // if there are quotes for the character, render the character page
        if (characterQuotes.length > 0) {

            // get character name
            let foundCharacter: Character | undefined = characterQuotes.find(fav => fav.character.character_id === characterId)?.character;

            if (foundCharacter) {
                res.render("character", {
                    character: foundCharacter,
                    characterQuotes: characterQuotes
                });
            }
            // if there are no quotes left for this character, go back to favorites page
        } else {
            res.redirect("/lotr/favorites");
        }

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/lotr/favorites/character/:characterId/:quoteId/delete", async (req, res) => {
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

        // delete from favorites
        await deleteFavorite(user, quoteId);

        res.redirect(`/lotr/favorites/character/${characterId}`);

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

// BLACKLIST

app.get("/lotr/blacklist", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        res.render("blacklist", { blacklist: user.blacklist });

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/lotr/blacklist/:quoteId/delete", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        // delete from blacklist
        const quoteId = req.params.quoteId;
        await deleteBlacklist(user, quoteId);

        res.redirect("/lotr/blacklist");

    } catch (err) {
        console.log(err);
        res.status(500);
        res.render("error-page", {
            errorMessage: "Probeer opnieuw aan te melden."
        });
    }
})

app.post("/lotr/blacklist/:quoteId/edit", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw "Could not find session user id";
        }
        const user = await getUserById(req.session.userId);
        if (!user) {
            throw "Could not find user in db";
        }

        // edit blacklist comment
        const quoteId = req.params.quoteId;
        const newComment = req.body.editComment;
        await editBlacklist(user, quoteId, newComment);

        res.redirect("/lotr/blacklist");

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