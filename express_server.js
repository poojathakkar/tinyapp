const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const findUserByEmail = (email) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
};

const addNewUser = (email, password) => {
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password
  };
  users[userId] = newUser;
  return userId;
};

const authenticateUser = (email, password) => {
  // Does the user with that email exist?
  const user = findUserByEmail(email);

  // check the email and passord match
  if (user && user.password === password) {
    return user.id;
  } else {
    return false;
  }
};

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {

  // Extract the user info from the request body
  const email = req.body.email;
  const password = req.body.password;

  // Authentication the user
  const userId = authenticateUser(email, password);

  if (userId) {
    // set the user id in the cookie
    res.cookie('user_id', userId);
    res.redirect('/urls');
  } else {
    res.status(403).send('Wrong credentials');
  }
});

app.get("/register", (req, res) => {
  let templateVars
  if (req.cookies){
    templateVars = { user: users[req.cookies["user_id"]] };
    res.render('register', templateVars);
  } else {
    res.render('register');
  }
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  console.log(`email: ${email}`);

  //if email or password is empty
  if (email === "" || password === "") {
   res.status(400).send('Error: Input email id and password');
  }
  //if user already exists
  const user = findUserByEmail(email);
  
  if (user) {
    res.status(401).send('Error: email already exists');
  } else {
    const userId = addNewUser(email, password);
    console.log(`userId: ${userId}`)
    res.cookie('user_id', userId);
    res.redirect('/urls');
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  console.log(`cookie: ${req.cookies["user_id"]}`)
  if(req.cookies){
    let templateVars = { urls: urlDatabase , user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/register')
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(templateVars.longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

 