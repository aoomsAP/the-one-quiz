import { User, Question, Movie, Quote, Character } from "./types";
import { ObjectId } from "mongodb";

export let mockUser: User = {
    username: "FrodoFan2000",
    password: "123",
    email: "frodo@gmail.com",
    favorites: [
        {
            quote_id: "5cd96e05de30eff6ebccefc1",
            dialog: "Bilbo have you been at the Gaffers homebrew?",
            character: {
                character_id: "5cd99d4bde30eff6ebccfc15",
                name: "Frodo Baggins",
                wikiUrl: "http://lotr.wikia.com//wiki/Frodo_Baggins"
            }
        },
        {
            quote_id: "5cd96e05de30eff6ebccefc2",
            dialog: "But it is not lost.",
            character: {
                character_id: "5cd99d4bde30eff6ebccfc07",
                name: "Arwen",
                wikiUrl: "http://lotr.wikia.com//wiki/Arwen"
            }
        },
        {
            quote_id: "5cd96e05de30eff6ebccefc3",
            dialog: "We have just passed into the realm of Gondor.",
            character: {
                character_id: "5cd99d4bde30eff6ebccfea0",
                name: "Gandalf",
                wikiUrl: "http://lotr.wikia.com//wiki/Gandalf"
            }
        }
    ],
    blacklist: [
        {
            quote_id: "5cd96e05de30eff6ebccefc4",
            dialog: "Yes the white tree of Gondor. The tree of the King. Lord Denethor however, is not the King. He is a steward only, a caretaker of the throne.",
            comment: "Eerst vond ik deze quote leuk, maar nu vind ik hem stom."

        },
        {
            quote_id: "5cd96e05de30eff6ebccefed",
            dialog: "See? I fooled you too.Don't worry about me, Pippin.",
            comment: "Zomaar. Ik ben een hater."

        },
        {
            quote_id: "5cd96e05de30eff6ebccefcb",
            dialog: "Lost! My Precious is lost.",
            comment: "Ik haat Gollum"

        }
    ],
    highscore_tenrounds: 4,
    highscore_suddendeath: 2
}

export let mockQuotes: Quote[] = [
    {
        quote_id: "5cd96e05de30eff6ebccefc1",
        dialog: "Bilbo have you been at the Gaffers homebrew?",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfc15",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefc2",
        dialog: "But it is not lost.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfc07",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefc3",
        dialog: "We have just passed into the realm of Gondor.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefc4",
        dialog: "Yes the white tree of Gondor. The tree of the King. Lord Denethor however, is not the King. He is a steward only, a caretaker of the throne.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefed",
        dialog: "See? I fooled you too.Don't worry about me, Pippin.",
        movie_id: "5cd95395de30eff6ebccde5b",
        character_id: "5cd99d4bde30eff6ebccfc7c",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefcb",
        dialog: "Lost! My Precious is lost.",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfe9e",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefd2",
        dialog: "Hmm hmm hmm hmm, Down from the door where it began, hmm hmm hmm hmm",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefda",
        dialog: "That Frodo is alive. Yes' yes he's alive.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefe1",
        dialog: "What's it saying my precious, my love? Is Smeagol losing his nerve?",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfe9e",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefcf",
        dialog: "This was my choice. Ada, whether by your will or not there is no ship now that can bear me hence.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfc07",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf000",
        dialog: "Let the Ringbearer decide.",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccefde",
        dialog: "Sshh, quiet, mustn't wake them. Mustn't ruin it now.",
        movie_id: "5cd95395de30eff6ebccde5d",
        character_id: "5cd99d4bde30eff6ebccfe9e",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf003",
        dialog: "Get the rope Sam.",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfc7c",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf004",
        dialog: "So be it.",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfea0",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf005",
        dialog: "We cannot stay here!This will be the death of the hobbits!",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfc57",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf006",
        dialog: "Strong?! Oh, that's good.",
        movie_id: "5cd95395de30eff6ebccde5b",
        character_id: "5cd99d4bde30eff6ebccfd23",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf007",
        dialog: "Frodo! Come on!",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfe2e",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf008",
        dialog: "We will go through the Mines.",
        movie_id: "5cd95395de30eff6ebccde5c",
        character_id: "5cd99d4bde30eff6ebccfc15",
    },
    {
        quote_id: "5cd96e05de30eff6ebccf009",
        dialog: "That is one of the Mearas......unless my eyes are cheated by some spell.",
        movie_id: "5cd95395de30eff6ebccde5b",
        character_id: "5cd99d4bde30eff6ebccfd81",
    },
]

export let mockCharacters: Character[] = [
    {
        character_id: "5cd99d4bde30eff6ebccfc15",
        name: "Frodo Baggins",
        wikiUrl: "http://lotr.wikia.com//wiki/Frodo_Baggins"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfc07",
        name: "Arwen",
        wikiUrl: "http://lotr.wikia.com//wiki/Arwen"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfea0",
        name: "Gandalf",
        wikiUrl: "http://lotr.wikia.com//wiki/Gandalf"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfe9e",
        name: "Gollum",
        wikiUrl: "http://lotr.wikia.com//wiki/Gollum"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfc7c",
        name: "Meriadoc Brandybuck",
        wikiUrl: "http://lotr.wikia.com//wiki/Meriadoc_Brandybuck"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfc57",
        name: "Boromir",
        wikiUrl: "http://lotr.wikia.com//wiki/Boromir"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfd23",
        name: "Gimli",
        wikiUrl: "http://lotr.wikia.com//wiki/Gimli"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfe2e",
        name: "Peregrin Took",
        wikiUrl: "http://lotr.wikia.com//wiki/Peregrin_Took"
    },
    {
        character_id: "5cd99d4bde30eff6ebccfd81",
        name: "Legolas",
        wikiUrl: "http://lotr.wikia.com//wiki/Legolas"
    }
]

export let mockMovies: Movie[] = [
    {
        movie_id: "5cd95395de30eff6ebccde5c",
        name: "The Fellowship of the Ring",
    },
    {
        movie_id: "5cd95395de30eff6ebccde5b",
        name: "The Two Towers",
    },
    {
        movie_id: "5cd95395de30eff6ebccde5d",
        name: "The Return of the King",
    }
]

export let mockQuestions: Question[] = [
    {
        quote_id: "5cd96e05de30eff6ebccefc1",
        dialog: "Bilbo have you been at the Gaffers homebrew?",
        correct_character: mockCharacters[0],
        wrong_characters: [mockCharacters[1], mockCharacters[2]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefc2",
        dialog: "But it is not lost.",
        correct_character: mockCharacters[1],
        wrong_characters: [mockCharacters[2], mockCharacters[3]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefc3",
        dialog: "We have just passed into the realm of Gondor.",
        correct_character: mockCharacters[2],
        wrong_characters: [mockCharacters[1], mockCharacters[3]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefcb",
        dialog: "Lost! My Precious is lost.",
        correct_character: mockCharacters[2],
        wrong_characters: [mockCharacters[1], mockCharacters[3]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefd2",
        dialog: "Hmm hmm hmm hmm, Down from the door where it began, hmm hmm hmm hmm",
        correct_character: mockCharacters[2],
        wrong_characters: [mockCharacters[3], mockCharacters[4]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefda",
        dialog: "That Frodo is alive. Yes' yes he's alive.",
        correct_character: mockCharacters[2],
        wrong_characters: [mockCharacters[0], mockCharacters[4]],
        correct_movie: mockMovies[2],
        wrong_movies: [mockMovies[0], mockMovies[1]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefe1",
        dialog: "What's it saying my precious, my love? Is Smeagol losing his nerve?",
        correct_character: mockCharacters[3],
        wrong_characters: [mockCharacters[2], mockCharacters[1]],
        correct_movie: mockMovies[2],
        wrong_movies: [mockMovies[0], mockMovies[1]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefcf",
        dialog: "This was my choice. Ada, whether by your will or not there is no ship now that can bear me hence.",
        correct_character: mockCharacters[1],
        wrong_characters: [mockCharacters[0], mockCharacters[3]],
        correct_movie: mockMovies[2],
        wrong_movies: [mockMovies[0], mockMovies[1]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccf000",
        dialog: "Let the Ringbearer decide.",
        correct_character: mockCharacters[2],
        wrong_characters: [mockCharacters[1], mockCharacters[3]],
        correct_movie: mockMovies[0],
        wrong_movies: [mockMovies[1], mockMovies[2]]
    },
    {
        quote_id: "5cd96e05de30eff6ebccefde",
        dialog: "Sshh, quiet, mustn't wake them. Mustn't ruin it now.",
        correct_character: mockCharacters[3],
        wrong_characters: [mockCharacters[0], mockCharacters[1]],
        correct_movie: mockMovies[2],
        wrong_movies: [mockMovies[0], mockMovies[1]]
    },
]