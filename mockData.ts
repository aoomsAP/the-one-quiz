import {User} from "./types";
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
            comment:"Eerst vond ik deze quote leuk, maar nu vind ik hem stom."
    
        },
        {
            quote_id: "5cd96e05de30eff6ebccefed",
            dialog: "See? I fooled you too.Don't worry about me, Pippin.",
            comment:"Zomaar. Ik ben een hater."
    
        },
        {
            quote_id: "5cd96e05de30eff6ebccefcb",
            dialog: "Lost! My Precious is lost.",
            comment:"Ik haat Gollum"
    
        }
    ],
    highscore_tenrounds: 4,
    highscore_suddendeath: 2
}

