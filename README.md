# PresGen Server

A Node.js Express server for presentation generation, using MongoDB and Mongoose.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```env
   MONGO_URI=mongodb://localhost:27017/presgen
   PORT=3000
   ```
   Adjust `MONGO_URI` as needed for your MongoDB instance.

3. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000` by default. 