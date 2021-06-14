const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
// const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
const bodyParser = require("body-parser");
// for env variable//
require("dotenv").config();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.raiw9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// JWT authentication server side //
const admin = require("firebase-admin");

const serviceAccount = require("./configs/burj-al-arab-8f8bb-firebase-adminsdk-a5jbh-8a949211e2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: process.env.DB_FIREBASE_URL,
});
////////////////////////////////////////////////////////////////

client.connect((err) => {
  // must set your database name and list name
  const bookingsCollection = client.db("burjAlArab").collection("Bookings");
  // perform actions on the collection object

  // CREATE DATA (C)
  app.post("/addBookings", (req, res) => {
    const newBooking = req.body;
    //add to database collection//
    bookingsCollection.insertOne(newBooking).then((result) => {
      // console.log(result);
      res.send(result.insertedCount > 0);
    });
    //////////////////////////////////
    console.log(newBooking);
  });

  // READ DATA (R)
  app.get("/bookings", (req, res) => {
    //receiving the query param to separate users by email//
    // console.log(req.query.email);

    // to get the JWT token in backend from headers//
    // console.log(req.headers.authorization);

    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      let idToken = bearer.split(" ")[1]; // to split the token which is in 2nd index//
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          // const uid = decodedToken.uid;

          // take user email and then again verify it//////////////////
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == req.query.email) {
            bookingsCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents); // must//
              });
          } else {
            res.status(401).send("Unauthorized Access");
          }
        })
        .catch((error) => {
          // Handle error
          res.status(401).send("Unauthorized Access");
        });
    } else {
      res.status(401).send("Unauthorized Access");
    }
  });

  console.log("database connection successful!");
});

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

app.listen(process.env.PORT || port);
