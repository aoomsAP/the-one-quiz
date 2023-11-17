import { ObjectId } from "mongodb";

export interface User {
    _id?: ObjectId,
    username: string,
    password: string,
    email: string,
    favorites: Favorite[],
    blacklist: Blacklist[],
    highscore_tenrounds: number,
    highscore_suddendeath: number,
}

export interface Favorite {
    quote_id: string,
    dialog: string,
    character: Character
}

export interface Blacklist {
    quote_id: string,
    dialog: string,
    comment: string
}

export interface Question {
    quote_id: string,
    dialog: string,
    correct_character: Character,
    wrong_characters: Character[],
    correct_movie: Movie,
    wrong_movies: Movie[],
    answer_character?: Character,
    answer_movie?: Movie
}

export interface Movie {
    movie_id: string,
    name: string
}

export interface Quote {
    quote_id: string,
    dialog: string,
    movie_id: string,
    character_id: string
}

export interface Character {
    character_id: string,
    name: string,
    wikiUrl: string
}

// Different object Character (API)

export interface CharacterApi{
    _id: string,
    height: string,
    race: string,
    gender: string,
    birth: string,
    spouse: string,
    death: string,
    realm: string,
    hair: string,
    name: string,
    wikiUrl: string
}

// Root Object voor Character (API)
export interface RootCharacter{
    docs: CharacterApi[];
    total: number,
    limit: number,
    offset: number,
    page: number,
    pages: number
}

// Different object quote (API)

export interface QuoteApi{
    _id: string,
    dialog: string,
    movie: string,
    character: string,
    id: string
}

// Root Object voor Quote (API)
export interface RootQuote{
    docs: QuoteApi[];
    total: number,
    limit: number,
    page: number,
    pages: number
}
