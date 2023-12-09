import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import SteamStrategy from "passport-steam";

const app = express();

app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

const SESSION_SECRET = 'YOUR_SESSION_SECRET'

// Setup session middleware
app.use(
  session({ secret: SESSION_SECRET, resave: true, saveUninitialized: true })
);

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

let currentSteamID: string = "";

// Configure Steam Strategy for Passport
passport.use(
  new SteamStrategy(
    {
      returnURL: `http://localhost:3000/auth/steam/return`,
      realm: `http://localhost:3000/`,
      apiKey: 'YOUR_STEAM_API_KEY',
    },
    (_identifier, profile, done) => {
      currentSteamID = profile._json.steamid || "";

      if (currentSteamID != '') {
        return done(null, profile);
      } else {
        return done(new Error(`Invalid: ${currentSteamID}`), null);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

// Route for Steam authentication
app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (_req, res) => {
    res.redirect("/");
  }
);

// Route for handling Steam authentication callback
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (_req, res) => {
    res.redirect("/");
  }
);

// Route for logging out
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: true,
        status: "Failed to logout",
        message: err,
      });
    }
    // Clear the session cookie
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
