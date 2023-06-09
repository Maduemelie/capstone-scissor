require("dotenv").config();
const app = require("./app");
const connectToDb = require('./config/conectMongodb')

const port = process.env.PORT || 7300;
connectToDb()
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
