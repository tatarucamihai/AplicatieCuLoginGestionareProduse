const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const pool = require('../db'); // Verifică că calea către modulul de bază de date este corectă
const router = express.Router();
// Middleware pentru a verifica autentificarea
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
// Ruta pentru pagina principala
router.get('/', (req, res) => {
    res.render('index', {
        user: req.user,
        currentLang: req.language, // Assuming you're using i18next middleware
        t: req.t
    });
});
// Ruta pentru pagina de înregistrare
router.get('/register', (req, res) => {
    res.render('register', {
        currentLang: req.language,
        t: req.t
    });
});

// Ruta pentru procesul de înregistrare
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]);
        if (result.affectedRows === 1) {
            res.redirect('/login');
        } else {
            throw new Error('Registration failed.');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.render('register', { error: 'Registration failed.' });
    }
});
// Ruta pentru pagina de conectare
router.get('/login', (req, res) => {
    res.render('login', {
        currentLang: req.language,
        t: req.t
    });
});

// Ruta pentru procesul de conectare
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
}));
// Ruta pentru deconectare
router.get('/logout', (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});
// Ruta pentru pagina de gestionare a produselor
router.get('/manage-products', isLoggedIn, async (req, res) => {
    try {
        const [userRows] = await pool.query('SELECT * FROM users');
        const users = userRows;
        const [productRows] = await pool.query('SELECT * FROM products');
        const products = productRows;
        res.render('manage-products', {
            products: products,
            currentLang: req.language, // Or however you determine the current language
            t: req.t // Pass the translation function as well
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products and users');
    }
});
// Adăugare produs - ruta pentru afișarea formularului
router.get('/add-product', isLoggedIn, (req, res) => {
    res.render('add-product', {
        currentLang: req.language,
        t: req.t
    });
});
// Adăugare produs - procesul de adăugare în baza de date
router.post('/add-product', isLoggedIn, async (req, res) => {
    try {
        const { name, price, description } = req.body;
        await pool.query('INSERT INTO products (name, price, description) VALUES (?, ?, ?)', [name, price,
            description]);
        res.redirect('/manage-products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding product');
    }
});
// Modificare produs - afișare formular
router.get('/edit-product/:id', isLoggedIn, async (req, res) => {
    const productId = req.params.id;
    try {
        const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
        const product = productRows[0];
        res.render('edit-product', {
            product: product,
            currentLang: req.language,
            t: req.t
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching product details');
    }
});
// Modificare produs - procesare formular
router.post('/edit-product/:id', isLoggedIn, async (req, res) => {
    const productId = req.params.id;
    const { name, price, description } = req.body;
    try {
        await pool.query('UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?', [name,
            price, description, productId]);
        res.redirect('/manage-products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating product');
    }
});
// Ștergere produs - afișare pagina de confirmare
router.get('/delete-product/:id', isLoggedIn, async (req, res) => {
    const productId = req.params.id;
    try {
        const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
        const product = productRows[0];
        res.render('delete-product', {
            product: product,
            currentLang: req.language, // Sau cum determinați limba curentă
            t: req.t // Funcția de traducere
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching product details');
    }
});

// Ștergere produs - procesare ștergere
router.post('/delete-product/:id', isLoggedIn, async (req, res) => {
    const productId = req.params.id;
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [productId]);
        res.redirect('/manage-products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting product');
    }
});


// In your main application file or a relevant router file


module.exports = router;