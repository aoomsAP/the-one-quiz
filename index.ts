require("dotenv").config();
import express from "express";
import { connect, createUser, getUser } from "./db";
import { User, Favorite, Blacklist, Question, Quote, Movie, Character, RootCharacter, RootQuote, RootMovie } from "./types";
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

    // write answers to question array
    addCharacterAnswerToQuestion(characterAnswer, questions[questionId]);
    addMovieAnswerToQuestion(movieAnswer, questions[questionId]);

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

app.get("/quiz/:type/score", (req, res) => {
    // e.g. http://localhost:3000/quiz/10rounds/score
    res.render("score");
})

app.get("/favorites", (req, res) => {
    // e.g. http://localhost:3000/favorites
    res.render("favorites");
})

app.get("/favorites/:characterId", (req, res) => {
    // e.g. http://localhost:3000/favorites/28392
    res.render("character");
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
  let rootCharacter : RootCharacter; // just existing
  let characterList: Character[] = []; // this is the final list where all characters will be in 

const loadCharacters = async () => {

    let responseCharacters = await fetch("https://the-one-api.dev/v2/character", { //"https://reqres.in/api/users" //https://the-one-api.dev/v2/character

    headers: {Authorization: `Bearer ${API_KEY}`} // {Authorization: `Bearer ${API_KEY}`} werkt niet? te bekijken...
    } 
    ) 
        .then(function(response){
            return response.json()
        })
        .then(function(response){
            //console.log(response.docs) // hier data heeft geen zin (is uit cursus) ??? not sure ? moet DOCS zijn !!!!
            rootCharacter = response;
        })
        ;

    //let characterList: Character[] = []; // this is the final list where all characters will be in -- moved higher up
    let characterTemp: Character; // this is a dummy character that will fill characterList

    // filtering + converting APICharacters to Characters objects
    for (let index = 0; index < rootCharacter.docs.length; index++) {
        if (rootCharacter.docs[index].name != ''){
            //console.log(rootCharacter.docs[index].name) // was ffe om te testen (werkt)

            // first check if data exists (only full objects?)
            if (rootCharacter.docs[index].wikiUrl != null && rootCharacter.docs[index].wikiUrl != ""){
            characterTemp = // omzetten API character naar ons object character (ID + Name + URL)

            
            
                {character_id: rootCharacter.docs[index]._id,
                name: rootCharacter.docs[index].name,
                wikiUrl: rootCharacter.docs[index].wikiUrl}

            characterList.push(characterTemp); // character toevoegen aan de lijst ==> characterList is dus de finale lijst met Character[] in
            }
            
            else{
                // er was geen URl
            }            
        }
        else{
            console.log(`${rootCharacter.docs[index].name} werd niet toegevoegd aan de lijst`)
        }
        
    }      
    

} // END ROOT CHARACTER LOGIC

// ----------------------------------------------- START QUOTE API LOGIC ---------------------------------------------------------------------------------

 // create root object
 let rootQuote : RootQuote; // just existing
 let rootQuoteTemp : RootQuote; // just existing temporary to combine the rest
 let quoteList: Quote[] = []; // this is the final list where all quotes will be in 

 const loadQuotes = async () => {
 
    for (let index = 0; index < 3; index++) {
        
        
    
     let responseQuotes = await fetch(`https://the-one-api.dev/v2/quote/?page=${index+1}`, { 
 
     headers: {Authorization: `Bearer ${API_KEY}`} 
     } 
     ) 
         .then(function(response){
             return response.json()
         })
         .then(function(response){
             
             rootQuoteTemp = response;
         })
         ;
        
         if (index == 0){
            rootQuote = rootQuoteTemp; // initialize object

         }
         else{
            rootQuote.docs = rootQuote.docs.concat(rootQuoteTemp.docs); // add the rest of quotes page 2 and 3

         }
         
        }

 
     //let quoteList: Quote[] = []; // this is the final list where all quotes will be in 
     let quoteTemp: Quote; // this is a dummy quote that will fill quoteList
 
     // filtering + converting APIQuotes to Quotes objects
     for (let index = 0; index < rootQuote.docs.length; index++) {
        
         if (rootQuote.docs[index].dialog != ''){ // quote cant be empty
            
 
             // first check if data exists (only full objects?)
             if (rootQuote.docs[index].movie != "" && rootQuote.docs[index].character != ""){ // must have a movie and a character linked to the quote
                
             quoteTemp = // omzetten API quote naar ons object quote (id + dialog + movie + character (API) ==> id + dialog + movie_ID + character_ID)           
             
                {quote_id: rootQuote.docs[index]._id,
                 dialog: rootQuote.docs[index].dialog,
                 movie_id: rootQuote.docs[index].movie,
                 character_id: rootQuote.docs[index].character                
                }
             
 
             quoteList.push(quoteTemp); // quote toevoegen aan de lijst ==> quoteList is dus de finale lijst met Quotes[] in

             }
             
             else{
                 // er ontbrak data - niet toevoegen
             }            
         }
         else{
             // er ontbrak data - niet toevoegen
         }
         
     }
         
     }

     // ----------------------------------------------- START MOVIE API LOGIC ---------------------------------------------------------------------------------
  // create root object
  let rootMovie : RootMovie; // just existing
  let movieList: Movie[] = []; // this is the final list where all movies will be in 

const loadMovies = async () => {

    let responseMovies = await fetch("https://the-one-api.dev/v2/movie", { 

    headers: {Authorization: `Bearer ${API_KEY}`} 
    } 
    ) 
        .then(function(response){
            return response.json()
        })
        .then(function(response){
            
            rootMovie = response;
        })
        ;

    let movieTemp: Movie; // this is a dummy movie that will fill characterList

    // filtering + converting APIMovies to Movie objects
    for (let index = 0; index < rootMovie.docs.length; index++) {
        if (rootMovie.docs[index].name == "The Fellowship of the Ring" || rootMovie.docs[index].name == "The Two Towers" || rootMovie.docs[index].name == "The Return of the King"){ // the 3 movies we need
            

            // first check if data exists (only full objects? for movie this is only the ID)
            if (rootMovie.docs[index]._id != null){
            movieTemp = // omzetten API movies naar ons object movies (ID + Name)

            
            
                {movie_id: rootMovie.docs[index]._id,
                name: rootMovie.docs[index].name}

            movieList.push(movieTemp); // movie toevoegen aan de lijst ==> movieList is dus de finale lijst met Movies[] in
            }
            
            else{
                // er was geen ID
            }            
        }
        else{
            // het was geen van de 3 main LOTR films - niet toevoegen aan lijst
        }
        
    }
   

} // END ROOT CHARACTER LOGIC
 
// ----------------------------------------------- END API LOGIC ---------------------------------------------------------------------------------
      
