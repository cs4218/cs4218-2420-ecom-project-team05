// server.js
import dotenv from "dotenv";
import colors from "colors";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

connectDB();

const PORT = process.env.PORT || 6060;
app.listen(PORT, () => {
    console.log(
        `Server running on ${PORT}`.bgCyan.white
    );
});