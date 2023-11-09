require("dotenv").config();
import { MongoClient } from "mongodb";
import { User, Favorite, Blacklist, Question, Movie, Character } from "./types";

if (typeof(process.env.URI) === "undefined") throw Error(`Error: .env var "URI" is undefined`); // needs to be added because typescript gives error if process.env is string/undefined
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





export { connect }