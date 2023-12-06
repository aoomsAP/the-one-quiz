import { Question, Quote, Movie, Character, RootCharacter, RootQuote, RootMovie } from "./types";

if (typeof (process.env.API_KEY) === "undefined") throw Error(`Error: .env var "API_KEY" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const API_KEY = process.env.API_KEY; // API_KEY in .env file

let quotes: Quote[] = [];
let characters: Character[] = [];
let movies: Movie[] = [];

// ----------------------------------------------- START OVERVIEW API LOGIC ---------------------------------------------------------------------------------

// ----------------------------------------------- START CHARACTER API LOGIC ---------------------------------------------------------------------------------
// create root object
let rootCharacter: RootCharacter; // just existing
//let characters: Character[] = []; // this is the final list where all characters will be in -- moved up to top 

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

    //let characters: Character[] = []; // this is the final list where all characters will be in -- moved higher up
    let characterTemp: Character; // this is a dummy character that will fill characters

    // filtering + converting APICharacters to Characters objects
    for (let index = 0; index < rootCharacter.docs.length; index++) {
        if (rootCharacter.docs[index].name != '' && !rootCharacter.docs[index].name.startsWith("User:")) {


            // first check if data exists (only full objects?)
            if (rootCharacter.docs[index].wikiUrl != null && rootCharacter.docs[index].wikiUrl != "") {
                characterTemp = // convert API character to our object character (ID + Name + URL)

                {
                    character_id: rootCharacter.docs[index]._id,
                    name: rootCharacter.docs[index].name,
                    wikiUrl: rootCharacter.docs[index].wikiUrl
                }

                characters.push(characterTemp); // character added to list ==> characters is final list with Character[] in
            }

        }
    }


} // END ROOT CHARACTER LOGIC

// ----------------------------------------------- START QUOTE API LOGIC ---------------------------------------------------------------------------------

// create root object
let rootQuote: RootQuote; // just existing to extract data
let rootQuoteTemp: RootQuote; // just existing temporary to combine the rest
//let quotes: Quote[] = []; // this is the final list where all quotes will be in 

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

    //let quotes: Quote[] = []; // this is the final list where all quotes will be in 
    let quoteTemp: Quote; // this is a dummy quote that will fill quotes

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

                for (let i = 0; i < characters.length; i++) {
                    if (quoteTemp.character_id == characters[i].character_id) { // check if person linked with quote is in the characters
                        quotes.push(quoteTemp); // add quote to list ==> quotes is final list with Quotes[] in
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
//let movies: Movie[] = []; // this is the final list where all movies will be in - moved up to top

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

    let movieTemp: Movie; // this is a dummy movie that will fill characters

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

                movies.push(movieTemp); // add movie to list ==> movies is final list with Movies[] in
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

export {quotes, characters, movies, loadCharacters, loadMovies, loadQuotes}

// ----------------------------------------------- END API LOGIC ---------------------------------------------------------------------------------