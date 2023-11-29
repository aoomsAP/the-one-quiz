import { Question, Quote, Movie, Character } from "./types";
import { quotes, characters, movies } from "./API"
import { questions } from "./index"

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


export { addNextQuestion, addCharacterAnswerToQuestion, addMovieAnswerToQuestion }