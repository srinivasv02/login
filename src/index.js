const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./config'); // Import the User model from config.js
const path = require('path');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/logsign', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

app.get('/', (req, res) => {
    res.render("login");
});

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const data = {
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: req.body.password
    };

    try {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.send("User already exists");
        } else {
            const saltrounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltrounds);
            data.password = hashedPassword;
        }

        const userdata = await User.create(data);
        console.log(userdata);
        res.redirect('/'); // Redirect to login page or wherever you want after successful signup
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            res.send("User not found");
        }

        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (passwordMatch) {
            res.render("home"); // You may want to redirect or set a session here
        } else {
            res.send("Incorrect password");
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/next", (req, res) => {
    res.render("next");
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
