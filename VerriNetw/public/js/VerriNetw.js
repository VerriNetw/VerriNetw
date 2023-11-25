const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.use(express.static('public'));

// Carica gli utenti dal file JSON
let users = loadUsers();
let thoughts = [];

// Funzione per caricare gli utenti dal file JSON
function loadUsers() {
  try {
    const usersData = fs.readFileSync('users.json');
    return JSON.parse(usersData);
  } catch (error) {
    // Se il file non esiste o è vuoto, restituisci un array vuoto
    return [];
  }
}

// Funzione per salvare gli utenti nel file JSON
function saveUsers() {
  const usersData = JSON.stringify(users, null, 2);
  fs.writeFileSync('users.json', usersData);
}

// Middleware per verificare se l'utente è autenticato
const authenticateUser = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', authenticateUser, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Verifica se l'utente esiste già
  const userExists = users.some(u => u.username === username || u.email === email);
  if (userExists) {
    // Se l'utente esiste già, mostra un popup e reindirizza alla pagina di login
    return res.send('<script>alert("Username o email già in uso. Prova con un altro."); window.location.href = "/login";</script>');
  }

  // Verifica l'indirizzo email
  if (!email.endsWith('@verri.edu.it')) {
    // Se l'indirizzo email non è valido, mostra un popup
    return res.send('<script>alert("L\'indirizzo email deve finire con @verri.edu.it"); window.location.href = "/register";</script>');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = { id: users.length + 1, username, password: hashedPassword, email };
  users.push(user);

  // Salva gli utenti nel file JSON
  saveUsers();

  req.session.userId = user.id;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/change-password', authenticateUser, (req, res) => {
  res.sendFile(__dirname + '/public/change-password.html');
});

app.post('/change-password', authenticateUser, (req, res) => {
  const userId = req.session.userId;
  const { oldPassword, newPassword } = req.body;
  const user = users.find(u => u.id === userId);

  if (user && bcrypt.compareSync(oldPassword, user.password)) {
    user.password = bcrypt.hashSync(newPassword, 10);
    res.redirect('/');
  } else {
    res.redirect('/change-password');
  }
});

app.get('/write-thought', authenticateUser, (req, res) => {
  res.sendFile(__dirname + '/public/write-thought.html');
});

app.post('/add-thought', authenticateUser, (req, res) => {
  const newThought = req.body.thought;
  if (newThought.length <= 500) {
    const userId = req.session.userId;
    const user = users.find(u => u.id === userId);

    // Aggiungi il pensiero alla lista
    thoughts.unshift({
      user: user.username,
      time: new Date().toLocaleTimeString(),
      content: newThought
    });

    res.redirect('/');
  } else {
    res.status(400).send('Il pensiero deve essere lungo al massimo 500 caratteri.');
  }
});

app.get('/thoughts', authenticateUser, (req, res) => {
  res.json(thoughts);
});

app.listen(port, () => {
  console.log(`Il server è in esecuzione all'indirizzo http://localhost:${port}`);
});

// public/script.js
document.addEventListener('DOMContentLoaded', () => {
  const thoughtsContainer = document.getElementById('thoughts-container');

  // Funzione per caricare e visualizzare i pensieri
  const loadAndDisplayThoughts = async () => {
    const response = await fetch('/thoughts');
    const thoughts = await response.json();

    thoughtsContainer.innerHTML = ''; // Pulisci il contenitore

    if (thoughts.length === 0) {
      const noThoughtsElement = document.createElement('p');
      noThoughtsElement.textContent = 'Nessun pensiero disponibile.';
      thoughtsContainer.appendChild(noThoughtsElement);
    } else {
      thoughts.forEach(thought => {
        const thoughtElement = createThoughtElement(thought);
        thoughtsContainer.appendChild(thoughtElement);
      });
    }
  };

  // Funzione per creare l'elemento HTML di un pensiero
  const createThoughtElement = (thought) => {
    const thoughtElement = document.createElement('div');
    thoughtElement.classList.add('thought');

    const userElement = document.createElement('span');
    userElement.classList.add('user');
    userElement.textContent = thought.user;

    const timeElement = document.createElement('span');
    timeElement.classList.add('time');
    timeElement.textContent = thought.time;

    const contentElement = document.createElement('div');
    contentElement.classList.add('content');
    contentElement.textContent = thought.content;

    thoughtElement.appendChild(userElement);
    thoughtElement.appendChild(timeElement);
    thoughtElement.appendChild(contentElement);

    return thoughtElement;
  };

  // Carica e visualizza i pensieri iniziali
  loadAndDisplayThoughts();
});

