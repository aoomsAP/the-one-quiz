interface User {
    _id?: number,
    username: string,
    password: string,
    email: string,
    favorites: Favorite[],
    blacklist: Blacklist[],
    highscore_tenrounds: number,
    highscore_suddendeath: number,
}

interface Favorite {
    quote_id: number,
    dialog: string,
    character: Character,
    character_id?: number
    wikiUrl: string
}

interface Blacklist {
    quote_id: number,
    dialog: string,
    comment: string
}

interface Question {
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

interface Film {
    movie_id: number,
    name: string
}

interface Quote {
    quote_id: number,
    dialog: string,
    movie_id: number,
    character_id: number
}

interface Character {
    character_id: number,
    name: string,
    wikiUrl: string
}