require("dotenv").config();
const app = require("./app");
const connectToDb = require('./config/conectMongodb')
const redisClient = require("./config/redisClient")

const port = process.env.PORT || 7300;
connectToDb()
redisClient.connect()
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
