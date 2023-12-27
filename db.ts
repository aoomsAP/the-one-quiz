require("dotenv").config();
import { MongoClient, ObjectId } from "mongodb";
import { User, Favorite, Blacklist, Question, Movie, Character } from "./types";

// CONNECTION
// ------------------------------------------------------------------------------------------------------

if (typeof (process.env.URI) === "undefined") throw Error(`Error: .env var "URI" is undefined`);
const client = new MongoClient(process.env.URI);

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

// USER
// ------------------------------------------------------------------------------------------------------

const createUser = async (newUser: User) => {
    try {
        await client.db("TheOneQuiz").collection("Users").insertOne(newUser);
    } catch (err) {
        throw "Could not create a user.";
    }
}

const getUser = async (username: string): Promise<User | null> => {
    let foundUser: User | null = null;

    try {
        foundUser = await client.db("TheOneQuiz").collection("Users").findOne<User>({ username: username });
    } catch (err) {
        throw "Could not get a user.";
    }

    return foundUser;
}

const getUserById = async (userId: ObjectId) => {
    let foundUser: User | null = null;

    try {
        foundUser = await client.db("TheOneQuiz").collection("Users").findOne<User>({ _id: new ObjectId(userId) });
    } catch (err) {
        throw "Could not get a user by id.";
    }

    return foundUser;
}

const getUserByEmail = async (email: string) => {
    let foundUser: User | null = null;

    try {
        foundUser = await client.db("TheOneQuiz").collection("Users").findOne<User>({ email: email });
    } catch (err) {
        throw "Could not get a user by email.";
    }

    return foundUser;
}

// QUESTION
// ------------------------------------------------------------------------------------------------------

const clearQuestions = async (userId: ObjectId) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: new ObjectId(userId) }, { $set: { questions: [] }});
    } catch (err) {
        throw "Could not clear questions";
    }
}

const writeQuestion = async (userId: ObjectId, question: Question) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: new ObjectId(userId) }, { $push: { questions: question }});
    } catch (err) {
        throw "Could not write question";
    }
}

// ANSWER
// ------------------------------------------------------------------------------------------------------

const writeCharacterAnswer = async (userId: ObjectId, quoteId: string, characterAnswer: Character) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: new ObjectId(userId), "questions.quote_id": quoteId }, { $set: { "questions.$.answer_character": characterAnswer }}, {upsert:true});
    } catch (err) {
        throw "Could not write character answer";
    } 
}

const writeMovieAnswer = async (userId: ObjectId, quoteId: string, movieAnswer: Movie) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: new ObjectId(userId), "questions.quote_id": quoteId }, { $set: { "questions.$.answer_movie": movieAnswer }}, {upsert:true});
    } catch (err) {
        throw "Could not write movie answer";
    } 
}

// SCORE
// ------------------------------------------------------------------------------------------------------

const createNewHighScore = async (user: User, typeOfQuiz: string, newHighScore: number) => {
    switch (typeOfQuiz) {
        case "tenrounds":
            user.highscore_tenrounds = newHighScore;
            try {
                await client.db("TheOneQuiz").collection("Users").updateOne({ username: user.username }, { $set: { highscore_tenrounds: newHighScore } });
            } catch (err) {
                throw "Could not create new ten rounds high score";
            }
            break;
        case "suddendeath":
            user.highscore_suddendeath = newHighScore;
            try {
                await client.db("TheOneQuiz").collection("Users").updateOne({ username: user.username }, { $set: { highscore_suddendeath: newHighScore } });
            } catch (err) {
                throw "Could not create new sudden death high score";
            }
            break;
        default:
            break;
    }
}

const addToFavorites = async (user: User, favorite: Favorite) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: user._id }, { $addToSet: { favorites: favorite } }
        )
    } catch (err) {
        throw "Could not add item to the favorites";
    }
}

const deleteFavorite = async (user: User, favorite: Favorite) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ _id: user._id },{$pull: { favorites: favorite }});
    } catch (err) {
        throw "Could not delete the favorite";
    }
}

// BLACKLIST
// ------------------------------------------------------------------------------------------------------

const addToBlacklist = async (user: User, blacklistItem: Blacklist) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne(
            { _id: user._id },
            {
                $addToSet: { blacklist: blacklistItem }
            }
        )
    } catch (err) {
        throw "Could not add item to the blacklist";
    }
}

const deleteBlacklist = async (user: User, quoteId: string) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ username: user.username }, { $pull: { blacklist: { quote_id: quoteId } } });
    } catch (err) {
        throw "Could not delete the blacklist item";
    }
}

const editBlacklist = async (user: User, quoteId: string, newComment: string) => {
    try {
        await client.db("TheOneQuiz").collection("Users").updateOne({ username: user.username, 'blacklist.quote_id': quoteId }, { $set: { 'blacklist.$.comment': newComment } });
    } catch (err) {
        throw "Could not edit the blacklist comment";
    }
}

export {
    client,
    connect,
    createUser,
    getUser,
    getUserById,
    getUserByEmail,
    clearQuestions,
    writeQuestion,
    writeCharacterAnswer,
    writeMovieAnswer,
    createNewHighScore,
    addToFavorites,
    addToBlacklist,
    deleteFavorite,
    deleteBlacklist,
    editBlacklist
}
