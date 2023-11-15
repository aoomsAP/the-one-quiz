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

//  Create user by adding the user to the DB
//  and assign it to the global variable 'user'

const createUser = async (newUser: User) => {
    try {
        await client.db("TheOneQuiz").collection("Users").insertOne(newUser);
    } catch (err) {
        console.log(err);
    }
}

// return user or null if not found in DB

const getUser = async (user: User): Promise<User | null> => {
    let foundUser: User | null = null;
    try {
        foundUser = await client.db("TheOneQuiz").collection("Users").findOne<User>({ username: user.username });
    } catch (err) {
        console.log(err);
    }

    return foundUser;
}

export { connect, createUser, getUser }