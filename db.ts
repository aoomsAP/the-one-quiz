require("dotenv").config();
import { MongoClient } from "mongodb";
import { User, Favorite, Blacklist, Question, Movie, Character } from "./types";


if (typeof (process.env.URI) === "undefined") throw Error(`Error: .env var "URI" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
const client = new MongoClient(process.env.URI); // mongo URI in .env file

const exit = async () => {
    try {
        await client.close(); // closing database connection
        console.log("Database closed successfully.")
        process.exit(0); // process ended without failure
    } catch (error) {
        console.error("Error: Problem with closing.");
    }
}

const connect = async () => {
    await client.connect(); // connection to database
    console.log("Database connected successfully.");
    process.on('SIGINT', exit); // when process receives SIGINT (terminate process immediately) signal, function to close database will run
}

// other database calls underneath:

// USER

const createUser = async (newUser: User) => {
    try {
        await client.db("TheOneQuiz").collection("Users").insertOne(newUser);
    } catch (err) {
        console.log(err);
    }
}

const getUser = async (username: string): Promise<User | null> => {
    let foundUser: User | null = null;
    
    try {
        foundUser = await client.db("TheOneQuiz").collection("Users").findOne<User>({ username: username });
    } catch (err) {
        console.log(err);
    }

    return foundUser;
}

// SCORE

const createNewHighScore = async (user: User, typeOfQuiz: string, newHighScore: number) => {
    switch (typeOfQuiz) {
        case "tenrounds":
            user.highscore_tenrounds = newHighScore; 
            try {
                await client.db("TheOneQuiz").collection("Users").updateOne({username: user.username}, {$set:{highscore_tenrounds: newHighScore}});
            } catch (err) {
                console.log(err);
            }
            break;
        case "suddendeath":
            user.highscore_suddendeath = newHighScore;
            try {
                await client.db("TheOneQuiz").collection("Users").updateOne({username: user.username}, {$set:{highscore_suddendeath: newHighScore}});
            } catch (err) {
                console.log(err);
            }
            break;
        default:
            break;
    }
}

// FAVORITES

const getUserFavorites = async (username: string): Promise<Favorite[] | undefined> => {
    let foundUser: User | null = await getUser(username);
    let favorites: Favorite[] | undefined = foundUser?.favorites;

    return favorites;
}

const addToFavorites = async (user: User, favorite: Favorite) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne(
            {_id: user._id},
            {
                $addToSet: {favorites: favorite}
            }
        )
    } catch (err) {
        console.log(err);
    }
}

const deleteFavorite = async (user: User, favorite: Favorite) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne(
            {_id: user._id},
            {
                $pull: {favorites: favorite}
            }
        )
    } catch (err) {
        console.log(err);
    }
}

// BLACKLIST

const getUserBlacklist = async (username: string): Promise<Blacklist[] | undefined> => {
    let foundUser: User | null = await getUser(username);
    let blacklist: Blacklist[] | undefined = foundUser?.blacklist;

    return blacklist;
}

const addToBlacklist = async (user: User, blacklistItem: Blacklist) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne(
            {_id: user._id},
            {
                $addToSet: {blacklist: blacklistItem}
            }
        )
    } catch (err) {
        console.log(err);
    }
}

// deleteBlacklistItem func


export { 
    connect, 
    createUser, 
    getUser, 
    createNewHighScore, 
    getUserFavorites, 
    addToFavorites, 
    addToBlacklist, 
    deleteFavorite, 
    getUserBlacklist 
}