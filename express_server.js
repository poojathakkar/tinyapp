const express = require("express");
const cookieParser = require('cookie-parser');
const { getUserByEmail } = require('./helper');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

app.use((req, res, next) => {
  req.currentUser = users[req.session['user_id']];
  next();
});

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

/*const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};*/

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const findLongURL = (shortURL) => {
  for (let url in urlDatabase) {
    if (urlDatabase[url] === shortURL) {
      return urlDatabase[url].longURL;
    } 
  }
  return false;
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    //password: "purple-monkey-dinosaur"
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    //password: "dishwasher-funk"
    password: bcrypt.hashSync("dishwasher-funk", saltRounds)
  }
};

const addNewUser = (email, password) => {
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, saltRounds),
  };
  users[userId] = newUser;
  return userId;
};

const authenticateUser = (email, password) => {
  // Does the user with that email exist?
  const user = getUserByEmail(email, users);

  // check the email and passord match
  if (user && bcrypt.compareSync(password, user.password)) {
    return user.id;
  } else {
    return false;
  }
};

const urlsForUser = (id) => {
  let outputUrl = {};
  for (let urls in urlDatabase) {
    if(urlDatabase[urls].userID === id) {
      outputUrl[urls] = { longURL: urlDatabase[urls].longURL } ;
    }
  }
  return outputUrl;
}

app.get("/login", (req, res) => {
  const templateVars = { user: null };
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
    req.session['user_id'] = userId;
    res.redirect('/urls');
  } else {
    res.status(403).send('Wrong credentials');
  }
});

app.get("/register", (req, res) => {
  if (req.session['user_id']){
    //templateVars = { user: users[req.session['user_id']] };
    req.session['user_id'] = null;
  }
  res.render('register', {user: null});

});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  console.log(`email: ${email}`);

  //if email or password is empty
  if (email === "" || password === "") {
   res.status(400).send('Error: Input email id and password');
  }
  //if user already exists
  const user = getUserByEmail(email, users);
  
  if (user) {
    res.status(401).send('Error: email already exists');
  } else {
    const userId = addNewUser(email, password);
    console.log(`userId: ${userId}`)
    //res.cookie('user_id', userId);
    req.session['user_id'] = userId;
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
  //console.log(`cookie: ${req.cookies["user_id"]}`)
  const userId = req.session['user_id'];
  const loggedInUser = users[userId];
  //if(urlForUser(userID))
  if(userId){
    const templateVars = { urls: urlsForUser(userId), user: loggedInUser}
    //const templateVars = { urls: urlList , user: loggedInUser };
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/register');
  }
});

app.get('/urls/new', (req, res) => {
  // get the current user
  // read the user id value from the cookies

  const userId = req.session['user_id'];
  const loggedInUser = users[userId];

  if(userId) {
    let templateVars = { user: loggedInUser };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userId = req.session['user_id'];
  const longURL = req.body.longURL;
  console.log(longURL);
  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {

  const userId = req.session['user_id'];
  const loggedInUser = users[userId];

  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: loggedInUser };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  console.log(urlDatabase);
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.redirect(templateVars.longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  //res.clearCookie('user_id');
  req.session['user_id'] = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

 