import { Quote, Movie, Character, MovieAPI, QuoteAPI, CharacterAPI } from "./types";

const API_KEY = process.env.API_KEY || "key";

let quotes: Quote[] = [];
let characters: Character[] = [];
let movies: Movie[] = [];

// CHARACTERS
// ------------------------------------------------------------------------------------------------------

const loadCharacters = async () => {
    let response = await fetch("https://the-one-api.dev/v2/character", {
        headers: {Authorization: `Bearer ${API_KEY}`}
    });
    let json = await response.json();

    characters = json.docs
        // translate API data to our interfaces - keeping only data we need
        .map((char: CharacterAPI) => {
            return {
                character_id: char._id,
                name: char.name,
                wikiUrl: char.wikiUrl
            }
        })
        // filter data:
        // 1) character name has to exist and can't be a "User" (mistake within API)
        // 2) character also needs to have a valid wikiUrl
        .filter((char: Character) => {
            return char.name != "" && !char.name.startsWith("User:") && char.wikiUrl != null && char.wikiUrl != "";
        });
}

// QUOTES
// ------------------------------------------------------------------------------------------------------

const loadQuotes = async () => {
    // increase limit to 3000 to avoid having to fetch 3 pages
    let response = await fetch("https://the-one-api.dev/v2/quote?limit=3000", {
        headers: {Authorization: `Bearer ${API_KEY}`}
    });
    let json = await response.json();

    quotes = json.docs
        // translate API data to our interfaces
        .map((q: QuoteAPI) => {
            return {
                quote_id: q._id,
                dialog: q.dialog,
                movie_id: q.movie,
                character_id: q.character,
            }
        })
        // filter data:
        // 1) only keep valid dialogue
        // 2) only keep quotes of characters that are in the filtered character list
        .filter((q: Quote) => q.dialog != "" && characters.some(char => char.character_id === q.character_id));
}

// MOVIES
// ------------------------------------------------------------------------------------------------------

const loadMovies = async () => {
    let response = await fetch("https://the-one-api.dev/v2/movie", {
        headers: {Authorization: `Bearer ${API_KEY}`}
    });
    let json = await response.json();

    movies = json.docs
        // translate API data to our interfaces
        .map((m: MovieAPI) => {
            return {
                movie_id: m._id,
                name: m.name
            }
        })
        // filter data:
        // we only need these three LOTR movies, since there are no API quotes from The Hobbit films
        .filter((m: Movie) => {
            return m.name === "The Fellowship of the Ring" || m.name === "The Two Towers" || m.name === "The Return of the King";
        });
}

export { quotes, characters, movies, loadCharacters, loadMovies, loadQuotes }