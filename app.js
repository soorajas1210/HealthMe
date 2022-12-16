const express = require("express");
const app = express();
const db = require("./config/connection");
const session = require("express-session");
const config = require("./config/config");
const dotenv = require("dotenv");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use("/admin", express.static("public/admin"));
app.use("/admin", express.static("public"));
app.use("/", express.static("public/user"));
app.use("/", express.static("public"));

app.use(
  session({
    secret: config.sessionSecret,
    saveUninitialized: true,
    cookie: { maxAge: 6000000 },
    resave: false,
  })
);

//cache controll
app.use(function (req, res, next) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

//Setting port
dotenv.config({ path: "config.env" });
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;

//connecting to db and listening to port
const callback = (err) => {
  if (!err) {
    app.listen(PORT, () => {
      console.log(`listening to port ${PORT}`);
    });
  }
};

//routes

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use(function (req, res) {
  res.status(404).render("users/404.ejs");
});

db.connectDb(callback);
