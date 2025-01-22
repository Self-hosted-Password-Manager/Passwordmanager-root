const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 3000;
const PASSWORD_FILE = 'passwords.json';
const AUTH_PASSWORD = '2265'; // The password to access the password manager

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === AUTH_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.get('/check-auth', (req, res) => {
    if (req.session.authenticated) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout.');
        }
        res.send('Logged out successfully.');
    });
});

app.post('/add-password', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    const { service, username, password } = req.body;
    let passwords = {};

    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
        }

        passwords[service] = { username, password };
        fs.writeFileSync(PASSWORD_FILE, JSON.stringify(passwords));
        res.send('Password added successfully!');
    } catch (error) {
        console.error('Error adding password:', error);
        res.status(500).send('Failed to add password.');
    }
});

app.post('/get-password', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    const { service } = req.body;
    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            const passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
            if (passwords[service]) {
                res.json(passwords[service]);
            } else {
                res.status(404).send('No password found for this service.');
            }
        } else {
            res.status(404).send('No password found for this service.');
        }
    } catch (error) {
        console.error('Error getting password:', error);
        res.status(500).send('Failed to get password.');
    }
});

app.delete('/delete-password', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    const { service } = req.body;
    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            let passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
            if (passwords[service]) {
                delete passwords[service];
                fs.writeFileSync(PASSWORD_FILE, JSON.stringify(passwords));
                res.send('Password deleted successfully!');
            } else {
                res.status(404).send('No password found for this service.');
            }
        } else {
            res.status(404).send('No password found for this service.');
        }
    } catch (error) {
        console.error('Error deleting password:', error);
        res.status(500).send('Failed to delete password.');
    }
});

app.put('/update-password', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    const { service, username, password } = req.body;
    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            let passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
            if (passwords[service]) {
                passwords[service] = { username, password };
                fs.writeFileSync(PASSWORD_FILE, JSON.stringify(passwords));
                res.send('Password updated successfully!');
            } else {
                res.status(404).send('No password found for this service.');
            }
        } else {
            res.status(404).send('No password found for this service.');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send('Failed to update password.');
    }
});

app.get('/search-password', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    const { service } = req.query;
    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            const passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
            if (passwords[service]) {
                res.json(passwords[service]);
            } else {
                res.status(404).send('No password found for this service.');
            }
        } else {
            res.status(404).send('No password found for this service.');
        }
    } catch (error) {
        console.error('Error searching password:', error);
        res.status(500).send('Failed to search password.');
    }
});

app.get('/list-passwords', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).send('Unauthorized');
    }

    try {
        if (fs.existsSync(PASSWORD_FILE)) {
            const passwords = JSON.parse(fs.readFileSync(PASSWORD_FILE));
            res.json(passwords);
        } else {
            res.status(404).send('No passwords found.');
        }
    } catch (error) {
        console.error('Error listing passwords:', error);
        res.status(500).send('Failed to list passwords.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
