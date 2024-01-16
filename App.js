const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('./db');
const routes = require('./routes');
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


// Other requires...
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
        },
        fallbackLng: 'en',
        preload: ['en','ro'] // Add your languages here
    });

app.use(middleware.handle(i18next));


// Set up i18next



passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            const user = rows[0];
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        const user = rows[0];
        done(null, user);
    } catch (error) {
        done(error);
    }
});
app.use('/', routes);
// Adăugăm o rută pentru editare produs
app.get('/edit-product/:id', async (req, res) => {
    // Implementați logica pentru editare și afișați pagina corespunzătoare

});
// Adăugăm o rută pentru ștergere produs
app.get('/delete-product/:id', async (req, res) => {
    // Implementați logica pentru ștergere și afișați pagina corespunzătoare
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// In your main application file or a relevant router file
app.get('/change-lang/:lang', (req, res) => {
    const newLang = req.params.lang;
    res.cookie('i18next', newLang); // Set the language preference
    res.redirect('back'); // Redirect back to the previous page
});
