const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const mongoosePaginate = require("mongoose-paginate-v2");

const app = express();
const PORT = process.env.PORT || 3000;

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("flash");

const session = require("express-session");

app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

passport.use(
  new LocalStrategy(function (username, password, done) {
    // Replace this with your own authentication logic
    if (username === "ADMINMalakSklawi" && password === "ADMINMalakSklawi") {
      return done(null, { username: "admin" });
    } else {
      return done(null, false, { message: "Invalid username or password" });
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.username);
});

passport.deserializeUser(function (id, done) {
  done(null, { username: id });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://mohammad:NuTTertYs12@cluster0.qt8a9.mongodb.net/test",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => console.log(err));

// Define Order schema
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  phoneNumber: { type: String, required: true },
  dormsLocation: { type: String, required: true },
  roomNumber: { type: String, required: true },
  url: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model("Order", orderSchema);

// Define routes
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Render the order form
app.get("/", (req, res) => {
  Order.find({}, (err, orders) => {
    if (err) {
      console.log(err);
    } else {
      res.render("index", { orders: orders });
    }
  });
});

// Create a new order
app.post("/orders", (req, res) => {
  const order = new Order({
    name: req.body.name,
    quantity: req.body.quantity,
    phoneNumber: req.body.phone,
    dormsLocation: req.body.dorms,
    roomNumber: req.body.room,
    url: req.body.url,
  });
  order.save((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

// Get all orders
app.get("/orders", isAuthenticated, async (req, res) => {
  const pageSize = 10; // Number of orders to display on each page
  const page = parseInt(req.query.page) || 1; // Default to page 1 if page query param is not provided
  const totalOrders = await Order.countDocuments();
  const totalPages = Math.ceil(totalOrders / pageSize);

  Order.find()
    .sort({ date: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .then((orders) => {
      res.render("order", {
        orders,
        currentPage: page,
        totalPages,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

app.post("/order/:id/delete", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect("/orders");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/orders",
    failureRedirect: "/login",
  })
);

app.get("/login", (req, res) => {
  res.render("login", { messages: req.flash("error") });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
