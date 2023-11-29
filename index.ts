require("dotenv").config();
import express from "express";
import { connect, createUser, getUser, createNewHighScore, addToFavorites, addToBlacklist, deleteFavorite, getUserFavorites } from "./db";
import { User, Favorite, Blacklist, Question, Quote, Movie, Character, RootCharacter, RootQuote, RootMovie } from "./types";
import { mockUser, mockQuotes, mockMovies, mockCharacters, mockQuestions } from "./mockData";
import fs from "fs";

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (typeof (process.env.API_KEY) === "undefined") throw Error(`Error: .env var "API_KEY" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const API_KEY = process.env.API_KEY; // API_KEY in .env file

let user: User | null = null;

let quoteList: Quote[] = []; // this is the final list where all quotes will be in from the API
let characterList: Character[] = []; // this is the final list where all characters will be in
let movieList: Movie[] = []; // this is the final list where all movies will be in 

let quotes: Quote[] = quoteList;
let characters: Character[] = characterList;
let movies: Movie[] = movieList; // TODO: delete mockMovies & fill in with loadData function in app.listen

let questions: Question[];

const loadUser = async (userName: string) => {
    let foundUser: User | null = await getUser(userName);
    if (!foundUser) {
        throw "User not found in db";
    }
    else {
        user = foundUser;
    }
}

app.get("/", (req, res) => {
    // e.g. http://localhost:3000/

    res.render("index", {
        user: user,
    });

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
        return res.render("login", {
            message: "Sorry, de ingevoerde gebruikersnaam en/of wachtwoord is niet correct. Probeer het opnieuw."
        });
    }

    if (foundUser.password === password) {

        user = foundUser;
        return res.status(200).redirect("/");

    } else {
        return res.render("login", {
            message: "Sorry, de ingevoerde gebruikersnaam en/of wachtwoord is niet correct. Probeer het opnieuw."
        });
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
    let confirmPassword: string = req.body.confirmPassword;
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
        return res.render("register", {
            message: "Gebruikersnaam is al in gebruik."
        });
    }

    if (password !== confirmPassword) {
        return res.render("register", {
            message: "De ingevoerde wachtwoorden komen niet overeen. Probeer het opnieuw."
        });
    }

    await createUser(newUser);
    user = newUser;
    return res.status(201).redirect("/");
})

app.get("/quiz", (req, res) => {
    // e.g. http://localhost:3000/quiz
    res.render("quiz");
})

// ---------- functions for adding questions

const quoteAppearsInBlacklist = (quoteId: string) => {
    if (user === null) {
        throw "User not found";
    }
    else {
        const blacklistedIds: string[] = user.blacklist.map(q => q.quote_id);
        return blacklistedIds.includes(quoteId);
    }
}

const quoteAlreadyInQuestions = (quoteId: string) => {
    const quoteIds: string[] = questions.map(q => q.quote_id);
    return quoteIds.includes(quoteId);
}

const getQuote = () => {
    // get random quote, on two conditions:
    // 1) it can't appear in the user's blacklist 2) it can't have been a question already
    let quote: Quote;
    do {
        let randomIndex = Math.floor(Math.random() * quotes.length);
        quote = quotes[randomIndex];
    } while (quoteAppearsInBlacklist(quote.quote_id) || quoteAlreadyInQuestions(quote.quote_id))
    return quote
}

const getTwoWrongCharacters = (correctCharacterId: string) => {
    const wrongCharacters: Character[] = [];

    // 1st wrong character can't be the same as the correct answer
    do {
        let randomIndex = Math.floor(Math.random() * characters.length);
        wrongCharacters[0] = characters[randomIndex];
    } while (correctCharacterId === wrongCharacters[0].character_id);

    // 2nd wrong character can't be the same as the correct answer, or the first wrong character
    do {
        let randomIndex = Math.floor(Math.random() * characters.length);
        wrongCharacters[1] = characters[randomIndex];
    } while (correctCharacterId === wrongCharacters[1].character_id || wrongCharacters[0] === wrongCharacters[1]);

    return wrongCharacters;
}

const getTwoWrongMovies = (correctMovieId: string) => {
    const wrongMovies: Movie[] = [];

    // 1st wrong movie can't be the same as the correct answer
    do {
        let randomIndex = Math.floor(Math.random() * movies.length);
        wrongMovies[0] = movies[randomIndex];
    } while (correctMovieId === wrongMovies[0].movie_id);

    // 2nd wrong movie can't be the same as the correct answer, or the first wrong movie
    do {
        let randomIndex = Math.floor(Math.random() * movies.length);
        wrongMovies[1] = movies[randomIndex];
    } while (correctMovieId === wrongMovies[1].movie_id || wrongMovies[0] === wrongMovies[1]);

    return wrongMovies;
}

const addNextQuestion = () => {
    // get random, valid, unique quote
    let quote: Quote = getQuote();

    // search characters array for the character that the quote belongs to
    let correctCharacter: Character | undefined = characters.find(character => quote.character_id === character.character_id);
    if (correctCharacter === undefined) throw "Character not found.";

    // search movies array for the movie that the quote belongs to
    let correctMovie: Movie | undefined = movies.find(movie => quote.movie_id === movie.movie_id);
    if (correctMovie === undefined) throw "Movie not found.";

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

// ---------- 

app.post("/quiz", (req, res) => {
    // clear previous questions array, start fresh
    questions = [];

    // add first question to questions array
    try {
        addNextQuestion();
    }
    catch (error) {
        console.log(error);
        res.status(404).send(error);
    }

    const typeOfQuiz: string = req.body.typeOfQuiz;

    // go to first question of the chosen type of quiz
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

// ---------- functions for adding answers to questions

const addCharacterAnswerToQuestion = (answerCharacterId: string, q: Question) => {
    // if answer is correct, answer_character = correct_character
    if (answerCharacterId === q.correct_character.character_id) {
        q.answer_character = q.correct_character;
    }
    // if answer is incorrect, answer_character = one of the wrong_characters
    else {
        if (answerCharacterId === q.wrong_characters[0].character_id) {
            q.answer_character = q.wrong_characters[0];
        }
        else {
            q.answer_character = q.wrong_characters[1];
        }
    }
}

const addMovieAnswerToQuestion = (answerMovieId: string, q: Question) => {
    // if answer is correct, answer_movie = correct_movie
    if (answerMovieId === q.correct_movie.movie_id) {
        q.answer_movie = q.correct_movie;
    }
    // if answer is incorrect, answer_movie = one of the wrong_movies
    else {
        if (answerMovieId === q.wrong_movies[0].movie_id) {
            q.answer_movie = q.wrong_movies[0];
        }
        else {
            q.answer_movie = q.wrong_movies[1];
        }
    }
}

// ---------- 

app.post("/quiz/:type/question/:questionId", async (req, res) => {

    const questionId: number = parseInt(req.params.questionId);
    const typeOfQuiz: string = req.params.type;
    const characterAnswer = req.body.btnradioChar;
    const movieAnswer = req.body.btnradioMovie;
    const comment: string = req.body.blacklistComment;

    const characterIsCorrect = characterAnswer === questions[questionId].correct_character.character_id;
    const movieIsCorrect = movieAnswer === questions[questionId].correct_movie.movie_id

    // write answers to question array
    addCharacterAnswerToQuestion(characterAnswer, questions[questionId]);
    addMovieAnswerToQuestion(movieAnswer, questions[questionId]);

    // handle thumbs up & thumbs down functionality
    // if user exists
    if (user) {
        // and if thumbs-up is checked, add quote to the user's favorites
        if (req.body.btnThumbs === "thumbsUp") {
            await addToFavorites(user,
                {
                    quote_id: questions[questionId].quote_id,
                    dialog: questions[questionId].dialog,
                    character: questions[questionId].correct_character
                });
            await loadUser(user.username);

        // and if thumbs-down is checked, add quote to the user's blacklist
        } else if (req.body.btnThumbs === "thumbsDown") {
            await addToBlacklist(user,
                {
                    quote_id: questions[questionId].quote_id,
                    dialog: questions[questionId].dialog,
                    comment: comment
                });
            await loadUser(user.username);
        }
    } else {
        throw "User not found";
    }
    

    // CHECK if end of quiz: redirect to score
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

    // DEFAULT action: generate the next question
    try {
        addNextQuestion();
    }
    catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
    // DEFAULT redirect: go to the next question
    res.redirect(`/quiz/${typeOfQuiz}/question/${questionId + 1}`);
})

app.get("/quiz/:type/score", async (req, res) => {
    const typeOfQuiz = req.params.type;
    let scores: number[] = [];
    let highScore: number = 0;

    if (user === null) {
        return res.status(404).send("User not found");
    }

    switch (typeOfQuiz) {
        case "tenrounds":
            scores = questions.map(q => {
                if (q.correct_character === q.answer_character && q.correct_movie === q.answer_movie) {
                    return 1;
                } else if (q.correct_character === q.answer_character || q.correct_movie === q.answer_movie) {
                    return 0.5;
                } else {
                    return 0;
                }
            });
            highScore = user.highscore_tenrounds;
            break;
        case "suddendeath":
            scores = questions.map(q => {
                if (q.correct_character === q.answer_character && q.correct_movie === q.answer_movie) {
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
        await loadUser(user.username);
        highScore = typeOfQuiz === "tenrounds" ? user.highscore_tenrounds : user.highscore_suddendeath;
    }

    res.render("score", {
        typeOfQuiz: typeOfQuiz,
        questions: questions,
        score: sumOfScores,
        highScore: highScore,
        newHighScore: newHighScore
    });
});


app.get("/favorites", async (req, res) => {
    if (user === null) {
        return res.status(404).send("User not found");
    }
    let favorites: Favorite[] | undefined = await getUserFavorites(user?.username);
    res.render("favorites", {
        favorites: favorites
    });
})


app.get("/favorites/download", (req, res) => {
    if (user === null) {
        return res.status(404).send("User not found");
    }

    const favList : string = user.favorites.reduce((favList: string,fav: Favorite) => {
        return favList + `${fav.dialog} - ${fav.character.name}\r\n`;
    },"");

    fs.writeFileSync(`./public/${user.username}_favorites.txt`,favList,"utf8");

    res.download(`./public/${user.username}_favorites.txt`);
});


app.get("/favorites/:characterId", async(req, res) => {
    // e.g. http://localhost:3000/favorites/28392
    const characterId: string = req.params.characterId;
    
    if (!user) {
        return res.status(404).send("User not found");
    }
    let favorites: Favorite[] | undefined = await getUserFavorites(user?.username);
    
    if (favorites) {
        let characterQuotes: Favorite[] = favorites.filter(fav => fav.character.character_id === characterId);
        if (characterQuotes.length > 0) {
            let foundCharacter:Character | undefined = characterQuotes.find(fav => fav.character.character_id === characterId)?.character;
            
            if(foundCharacter) {
                res.render("character", {
                    character: foundCharacter,
                    characterQuotes: characterQuotes
                });
            }        
        } else {
            // if all quotes of a specific char have been deleted, redirect to favorites
            res.redirect("/favorites");
        }
    }
    
})

app.post("/favorites/:characterId/:quoteId/delete", async (req, res) => {
    const quoteId: string = req.params.quoteId;
    const characterId: string = req.params.characterId;
    
    if (!user) {
        return res.status(404).send("User not found");
    }
    let favorites: Favorite[] | undefined = await getUserFavorites(user?.username);
    if (favorites) {
        let favorite: Favorite | undefined = favorites.find(fav => fav.quote_id === quoteId); 
        
        if(favorite) {
            await deleteFavorite(user, favorite);
            res.redirect(`/favorites/${characterId}`);
        }         
    }
  
})

app.post("/favorites/:quoteId/delete", async (req, res) => {
    const quoteId: string = req.params.quoteId;
    
    if (!user) {
        return res.status(404).send("User not found");
    }
    let favorites: Favorite[] | undefined = await getUserFavorites(user?.username);
    if (favorites) {
        let favorite: Favorite | undefined = favorites.find(fav => fav.quote_id === quoteId); 
        
        if(favorite) {
            await deleteFavorite(user, favorite);
            res.redirect(`/favorites`);
        }         
    }
})

app.get("/blacklist", (req, res) => {
    // e.g. http://localhost:3000/blacklist
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
    await loadCharacters(); // this function will load all characters from the one api
    await loadQuotes();
    await loadMovies();
})

// ----------------------------------------------- START OVERVIEW API LOGIC ---------------------------------------------------------------------------------

// ----------------------------------------------- START CHARACTER API LOGIC ---------------------------------------------------------------------------------
// create root object
let rootCharacter: RootCharacter; // just existing
//let characterList: Character[] = []; // this is the final list where all characters will be in -- moved up to top 

const loadCharacters = async () => {

    let responseCharacters = await fetch("https://the-one-api.dev/v2/character", {

        headers: { Authorization: `Bearer ${API_KEY}` }
    }
    )
        .then(function (response) {
            return response.json()
        })
        .then(function (response) {

            rootCharacter = response;
        })
        ;

    //let characterList: Character[] = []; // this is the final list where all characters will be in -- moved higher up
    let characterTemp: Character; // this is a dummy character that will fill characterList

    // filtering + converting APICharacters to Characters objects
    for (let index = 0; index < rootCharacter.docs.length; index++) {
        if (rootCharacter.docs[index].name != '') {


            // first check if data exists (only full objects?)
            if (rootCharacter.docs[index].wikiUrl != null && rootCharacter.docs[index].wikiUrl != "") {
                characterTemp = // convert API character to our object character (ID + Name + URL)

                {
                    character_id: rootCharacter.docs[index]._id,
                    name: rootCharacter.docs[index].name,
                    wikiUrl: rootCharacter.docs[index].wikiUrl
                }

                characterList.push(characterTemp); // character added to list ==> characterList is final list with Character[] in
            }

        }
        else {
            console.log(`${rootCharacter.docs[index].name} werd niet toegevoegd aan de lijst`)
        }

    }


} // END ROOT CHARACTER LOGIC

// ----------------------------------------------- START QUOTE API LOGIC ---------------------------------------------------------------------------------

// create root object
let rootQuote: RootQuote; // just existing to extract data
let rootQuoteTemp: RootQuote; // just existing temporary to combine the rest
//let quoteList: Quote[] = []; // this is the final list where all quotes will be in 

const loadQuotes = async () => {

    for (let index = 0; index < 3; index++) {



        let responseQuotes = await fetch(`https://the-one-api.dev/v2/quote/?page=${index + 1}`, {

            headers: { Authorization: `Bearer ${API_KEY}` }
        }
        )
            .then(function (response) {
                return response.json()
            })
            .then(function (response) {

                rootQuoteTemp = response;
            })
            ;

        if (index == 0) {
            rootQuote = rootQuoteTemp; // initialize object

        }
        else {
            rootQuote.docs = rootQuote.docs.concat(rootQuoteTemp.docs); // add the rest of quotes page 2 and 3

        }

    }

    //let quoteList: Quote[] = []; // this is the final list where all quotes will be in 
    let quoteTemp: Quote; // this is a dummy quote that will fill quoteList

    // filtering + converting APIQuotes to Quotes objects
    for (let index = 0; index < rootQuote.docs.length; index++) {

        if (rootQuote.docs[index].dialog != '') { // quote cant be empty


            // first check if data exists (only full objects?)
            if (rootQuote.docs[index].movie != "" && rootQuote.docs[index].character != "") { // must have a movie and a character linked to the quote

                quoteTemp = // convert api quote to our object quote (id + dialog + movie + character (API) ==> id + dialog + movie_ID + character_ID)           

                {
                    quote_id: rootQuote.docs[index]._id,
                    dialog: rootQuote.docs[index].dialog,
                    movie_id: rootQuote.docs[index].movie,
                    character_id: rootQuote.docs[index].character
                }

                for (let i = 0; i < characterList.length; i++) {
                    if (quoteTemp.character_id == characterList[i].character_id) { // check if person linked with quote is in the characterlist
                        quoteList.push(quoteTemp); // add quote to list ==> quoteList is final list with Quotes[] in
                        break;
                    }
                    else {
                        // dont add quote to the list, since its relevant character is not in it
                    }

                }

            }

            else {
                // data missing - dont add
            }
        }
        else {
            // data missing - dont add
        }

    }


}

// ----------------------------------------------- START MOVIE API LOGIC ---------------------------------------------------------------------------------
// create root object
let rootMovie: RootMovie; // just existing to extract data
//let movieList: Movie[] = []; // this is the final list where all movies will be in - moved up to top

const loadMovies = async () => {

    let responseMovies = await fetch("https://the-one-api.dev/v2/movie", {

        headers: { Authorization: `Bearer ${API_KEY}` }
    }
    )
        .then(function (response) {
            return response.json()
        })
        .then(function (response) {

            rootMovie = response;
        })
        ;

    let movieTemp: Movie; // this is a dummy movie that will fill characterList

    // filtering + converting APIMovies to Movie objects
    for (let index = 0; index < rootMovie.docs.length; index++) {
        if (rootMovie.docs[index].name == "The Fellowship of the Ring" || rootMovie.docs[index].name == "The Two Towers" || rootMovie.docs[index].name == "The Return of the King") { // the 3 movies we need


            // first check if data exists (only full objects? for movie this is only the ID)
            if (rootMovie.docs[index]._id != null) {
                movieTemp = // convert API Movies to our object Movie (ID + Name)



                {
                    movie_id: rootMovie.docs[index]._id,
                    name: rootMovie.docs[index].name
                }

                movieList.push(movieTemp); // add movie to list ==> movieList is final list with Movies[] in
            }

            else {
                // there was no ID
            }
        }
        else {
            // it was not one of the 3 major LOTR movies - dont add to list
        }

    }


} // END ROOT CHARACTER LOGIC

// ----------------------------------------------- END API LOGIC ---------------------------------------------------------------------------------

