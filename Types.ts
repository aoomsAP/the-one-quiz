export interface User {
    _id?: number,
    username: string,
    password: string,
    email: string,
    favorites: Favorite[],
    blacklist: Blacklist[],
    highscore_tenrounds: number,
    highscore_suddendeath: number,
}

export interface Favorite {
    quote_id: number,
    dialog: string,
    character: Character,
    character_id?: number
    wikiUrl: string
}

export interface Blacklist {
    quote_id: number,
    dialog: string,
    comment: string
}

export interface Question {
    quote_id: number,
    dialog: string,
    correct_character: Character,
    wrong_characters: Character[],
    correct_film: string,
    wrong_films: Film[],
    wikiUrl: string,
    answer_character?: Character,
    answer_film?: Film
}

export interface Film {
    movie_id: number,
    name: string
}

export interface Quote {
    quote_id: number,
    dialog: string,
    movie_id: number,
    character_id: number
}

export interface Character {
    character_id: number,
    name: string,
    wikiUrl: string
}