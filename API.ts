import { Quote, Movie, Character, RootCharacter, RootQuote, RootMovie } from "./types";

const API_KEY = process.env.API_KEY || "key";

let quotes: Quote[] = [];
let characters: Character[] = [];
let movies: Movie[] = [];

// CHARACTERS
// ------------------------------------------------------------------------------------------------------

let rootCharacter: RootCharacter;

const loadCharacters = async () => {
    await fetch("https://the-one-api.dev/v2/character", {
        headers: { Authorization: `Bearer ${API_KEY}` }
    })
    .then(response => {
        return response.json()
    })
    .then(response => {
        rootCharacter = response;
    });

    // filtering of api data
    for (let index = 0; index < rootCharacter.docs.length; index++) {

        // character name has to exist and can't be a User (mistake of API)
        // character also needs to have a valid wikiUrl
        if (rootCharacter.docs[index].name != '' && !rootCharacter.docs[index].name.startsWith("User:")
            && rootCharacter.docs[index].wikiUrl != null && rootCharacter.docs[index].wikiUrl != "") {

            // convert api character to our interface
            let character: Character =
            {
                character_id: rootCharacter.docs[index]._id,
                name: rootCharacter.docs[index].name,
                wikiUrl: rootCharacter.docs[index].wikiUrl
            }
            characters.push(character);
        }
    }
}

// QUOTES
// ------------------------------------------------------------------------------------------------------

let rootQuote: RootQuote;

const loadQuotes = async () => {
    // increase limit to 3000 to avoid having to fetch 3 pages
    await fetch(`https://the-one-api.dev/v2/quote?limit=3000`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
    })
    .then(response => {
        return response.json()
    })
    .then(response => {
        rootQuote = response;
    });

    // filtering of api data
    for (let index = 0; index < rootQuote.docs.length; index++) {

        // quote must have all the necessary data
        if (rootQuote.docs[index].dialog != '' && rootQuote.docs[index].movie != "" && rootQuote.docs[index].character != "") {

            // convert api quote to our interface    
            let quote: Quote =
            {
                quote_id: rootQuote.docs[index]._id,
                dialog: rootQuote.docs[index].dialog,
                movie_id: rootQuote.docs[index].movie,
                character_id: rootQuote.docs[index].character
            }

            // only keep quotes of characters that are in the character list
            for (let i = 0; i < characters.length; i++) {
                if (quote.character_id == characters[i].character_id) {
                    quotes.push(quote);
                    break;
                }
            }
        }
    }
}

// MOVIES
// ------------------------------------------------------------------------------------------------------

let rootMovie: RootMovie;

const loadMovies = async () => {
    await fetch("https://the-one-api.dev/v2/movie", {
        headers: { Authorization: `Bearer ${API_KEY}` }
    })
    .then(response => {
        return response.json()
    })
    .then(response => {
        rootMovie = response;
    });

    // filtering of api data
    for (let index = 0; index < rootMovie.docs.length; index++) {

        // we only need these three movies, since there are no quotes from the hobbit films
        if (rootMovie.docs[index].name == "The Fellowship of the Ring" || rootMovie.docs[index].name == "The Two Towers" || rootMovie.docs[index].name == "The Return of the King") {

            // convert api movie to our interface
            let movie: Movie =
            {
                movie_id: rootMovie.docs[index]._id,
                name: rootMovie.docs[index].name
            }
            movies.push(movie);
        }
    }
}

export { quotes, characters, movies, loadCharacters, loadMovies, loadQuotes }