import { MongoClient } from "mongodb";

const uri = "mongodb+srv://theonequiz:zVJqbl0LO1eExdmR@theonequiz.fh8kyjq.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

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