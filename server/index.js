const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(cors());
app.use(express.json());

// Initialize DB (file-based for persistence in dev)
const db = new Database('bnq.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  userId INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  userId INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);
 
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  director TEXT NOT NULL,
  description TEXT NOT NULL,
  userId INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  userId INTEGER NOT NULL,
  createdAt TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  duration INTEGER,
  location TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  tags TEXT,
  notes TEXT,
  userId INTEGER NOT NULL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);
`);

// Safe column adder: only add if the column does not exist
function ensureColumn(table, column, type) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = cols.some(c => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  } catch (e) {
    // Log but don't crash the server on first boot
    console.warn(`Column check/add failed for ${table}.${column}:`, e.message);
  }
}

// Add new columns to existing tables for enhanced functionality
ensureColumn('quotes', 'source', 'TEXT');
ensureColumn('quotes', 'category', 'TEXT');
ensureColumn('quotes', 'date', 'TEXT');
ensureColumn('quotes', 'tags', 'TEXT');
ensureColumn('quotes', 'notes', 'TEXT');

ensureColumn('movies', 'releaseYear', 'INTEGER');
ensureColumn('movies', 'genre', 'TEXT');
ensureColumn('movies', 'rating', 'TEXT');
ensureColumn('movies', 'notes', 'TEXT');

ensureColumn('diaries', 'date', 'TEXT');
ensureColumn('diaries', 'mood', 'TEXT');
ensureColumn('diaries', 'weather', 'TEXT');
ensureColumn('diaries', 'location', 'TEXT');
ensureColumn('diaries', 'tags', 'TEXT');
ensureColumn('diaries', 'privateNotes', 'TEXT');

ensureColumn('books', 'publicationYear', 'INTEGER');
ensureColumn('books', 'genre', 'TEXT');
ensureColumn('books', 'rating', 'TEXT');
ensureColumn('books', 'pages', 'INTEGER');
ensureColumn('books', 'status', 'TEXT');
ensureColumn('books', 'tags', 'TEXT');
ensureColumn('books', 'notes', 'TEXT');

// Ensure createdAt column exists on diaries (SQLite lacks IF NOT EXISTS for columns)
try {
  const diaryColumns = db.prepare("PRAGMA table_info(diaries)").all();
  const hasCreatedAt = diaryColumns.some(c => c.name === 'createdAt');
  if (!hasCreatedAt) {
    db.exec("ALTER TABLE diaries ADD COLUMN createdAt TEXT");
  }
} catch (e) {
  // swallow; table may be mid-migration on first run
}

function createToken(user) {
  return jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Helper function to process book data before returning
function processBook(book) {
  if (!book) return book;
  const processed = { 
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    userId: book.userId,
    publicationYear: book.publicationYear !== undefined ? book.publicationYear : null,
    genre: book.genre !== undefined ? book.genre : null,
    rating: book.rating !== undefined ? book.rating : null,
    pages: book.pages !== undefined ? book.pages : null,
    status: book.status !== undefined ? book.status : null,
    notes: book.notes !== undefined ? book.notes : null,
    tags: null
  };
  // Parse tags from JSON string to array
  if (book.tags && typeof book.tags === 'string') {
    try {
      processed.tags = JSON.parse(book.tags);
    } catch (e) {
      // If parsing fails, treat as comma-separated string
      processed.tags = book.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } else if (book.tags) {
    processed.tags = book.tags;
  }
  return processed;
}

// Helper function to process array of books
function processBooks(books) {
  return books.map(book => processBook(book));
}

// Helper function to process quote data before returning
function processQuote(quote) {
  if (!quote) return quote;
  const processed = { 
    id: quote.id,
    title: quote.title,
    author: quote.author,
    description: quote.description,
    userId: quote.userId,
    source: quote.source !== undefined ? quote.source : null,
    category: quote.category !== undefined ? quote.category : null,
    date: quote.date !== undefined ? quote.date : null,
    notes: quote.notes !== undefined ? quote.notes : null,
    tags: null
  };
  // Parse tags from JSON string to array
  if (quote.tags && typeof quote.tags === 'string') {
    try {
      processed.tags = JSON.parse(quote.tags);
    } catch (e) {
      processed.tags = quote.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } else if (quote.tags) {
    processed.tags = quote.tags;
  }
  return processed;
}

// Helper function to process array of quotes
function processQuotes(quotes) {
  return quotes.map(quote => processQuote(quote));
}

// Helper function to process movie data before returning
function processMovie(movie) {
  if (!movie) return movie;
  const processed = { 
    id: movie.id,
    title: movie.title,
    director: movie.director,
    description: movie.description,
    userId: movie.userId,
    releaseYear: movie.releaseYear !== undefined ? movie.releaseYear : null,
    genre: movie.genre !== undefined ? movie.genre : null,
    rating: movie.rating !== undefined ? movie.rating : null,
    notes: movie.notes !== undefined ? movie.notes : null
  };
  return processed;
}

// Helper function to process array of movies
function processMovies(movies) {
  return movies.map(movie => processMovie(movie));
}

// Helper function to process diary data before returning
function processDiary(diary) {
  if (!diary) return diary;
  const processed = { 
    id: diary.id,
    title: diary.title,
    body: diary.body,
    userId: diary.userId,
    createdAt: diary.createdAt !== undefined ? diary.createdAt : null,
    date: diary.date !== undefined ? diary.date : null,
    mood: diary.mood !== undefined ? diary.mood : null,
    weather: diary.weather !== undefined ? diary.weather : null,
    location: diary.location !== undefined ? diary.location : null,
    privateNotes: diary.privateNotes !== undefined ? diary.privateNotes : null,
    tags: null
  };
  // Parse tags from JSON string to array
  if (diary.tags && typeof diary.tags === 'string') {
    try {
      processed.tags = JSON.parse(diary.tags);
    } catch (e) {
      processed.tags = diary.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } else if (diary.tags) {
    processed.tags = diary.tags;
  }
  return processed;
}

// Helper function to process array of diaries
function processDiaries(diaries) {
  return diaries.map(diary => processDiary(diary));
}

// Auth routes
app.post('/api/users/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const existing = db.prepare('SELECT id FROM users WHERE name = ? OR email = ?').get(name, email);
    if (existing) return res.status(400).json({ message: 'User already exists.' });
    const passwordHash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (name, email, passwordHash) VALUES (?, ?, ?)').run(name, email, passwordHash);
    const user = { id: info.lastInsertRowid, name };
    const token = createToken(user);
    return res.json({ token, userId: user.id });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = createToken(user);
    return res.json({ token, userId: user.id });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Books
app.get('/api/users/:userId/books', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books WHERE userId = ?').all(userId);
  return res.json(processBooks(rows));
});

app.get('/api/books', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books').all();
  return res.json(processBooks(rows));
});

app.post('/api/users/:userId/books', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, author, description, publicationYear, genre, rating, pages, status, tags, notes } = req.body;
  console.log('Received book data:', req.body);
  console.log('Extracted fields:', { title, author, description, publicationYear, genre, rating, pages, status, tags, notes });
  if (!title || !author || !description) return res.status(400).json({ message: 'Missing required fields' });
  
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  console.log('Tags JSON:', tagsJson);
  
  // Preserve empty strings, but convert undefined to null
  const info = db.prepare('INSERT INTO books (title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(
      title, 
      author, 
      description, 
      publicationYear !== undefined && publicationYear !== '' ? publicationYear : null,
      genre !== undefined && genre !== '' ? genre : null,
      rating !== undefined && rating !== '' ? rating : null,
      pages !== undefined && pages !== '' ? pages : null,
      status !== undefined && status !== '' ? status : null,
      tagsJson,
      notes !== undefined && notes !== '' ? notes : null,
      userId
    );
  // Explicitly select all columns to ensure they're included
  const book = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books WHERE id = ?').get(info.lastInsertRowid);
  console.log('Raw book from database:', book);
  console.log('Book columns:', Object.keys(book || {}));
  const processed = processBook(book);
  console.log('Processed book before sending:', processed);
  return res.status(201).json(processed);
});

app.put('/api/books/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, author, description, publicationYear, genre, rating, pages, status, tags, notes } = req.body;
  const existing = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  // Handle updates: use new value if provided, otherwise keep existing
  db.prepare('UPDATE books SET title = ?, author = ?, description = ?, publicationYear = ?, genre = ?, rating = ?, pages = ?, status = ?, tags = ?, notes = ? WHERE id = ?')
    .run(
      title !== undefined ? title : existing.title,
      author !== undefined ? author : existing.author,
      description !== undefined ? description : existing.description,
      publicationYear !== undefined && publicationYear !== '' ? publicationYear : (publicationYear === '' ? null : existing.publicationYear),
      genre !== undefined && genre !== '' ? genre : (genre === '' ? null : existing.genre),
      rating !== undefined && rating !== '' ? rating : (rating === '' ? null : existing.rating),
      pages !== undefined && pages !== '' ? pages : (pages === '' ? null : existing.pages),
      status !== undefined && status !== '' ? status : (status === '' ? null : existing.status),
      tags !== undefined ? tagsJson : existing.tags,
      notes !== undefined && notes !== '' ? notes : (notes === '' ? null : existing.notes),
      id
    );
  const updated = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books WHERE id = ?').get(id);
  return res.json(processBook(updated));
});

app.delete('/api/books/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id, title, author, description, publicationYear, genre, rating, pages, status, tags, notes, userId FROM books WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM books WHERE id = ?').run(id);
  return res.status(204).send();
});

// Quotes
app.get('/api/users/:userId/quotes', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes WHERE userId = ?').all(userId);
  return res.json(processQuotes(rows));
});

app.get('/api/quotes', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes').all();
  return res.json(processQuotes(rows));
});

app.post('/api/users/:userId/quotes', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, author, description, source, category, date, tags, notes } = req.body;
  if (!title || !author || !description) return res.status(400).json({ message: 'Missing required fields' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const info = db.prepare('INSERT INTO quotes (title, author, description, source, category, date, tags, notes, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(
      title, 
      author, 
      description, 
      source !== undefined && source !== '' ? source : null,
      category !== undefined && category !== '' ? category : null,
      date !== undefined && date !== '' ? date : null,
      tagsJson,
      notes !== undefined && notes !== '' ? notes : null,
      userId
    );
  const quote = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(processQuote(quote));
});

app.put('/api/quotes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, author, description, source, category, date, tags, notes } = req.body;
  const existing = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  db.prepare('UPDATE quotes SET title = ?, author = ?, description = ?, source = ?, category = ?, date = ?, tags = ?, notes = ? WHERE id = ?')
    .run(
      title !== undefined ? title : existing.title,
      author !== undefined ? author : existing.author,
      description !== undefined ? description : existing.description,
      source !== undefined && source !== '' ? source : (source === '' ? null : existing.source),
      category !== undefined && category !== '' ? category : (category === '' ? null : existing.category),
      date !== undefined && date !== '' ? date : (date === '' ? null : existing.date),
      tags !== undefined ? tagsJson : existing.tags,
      notes !== undefined && notes !== '' ? notes : (notes === '' ? null : existing.notes),
      id
    );
  const updated = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes WHERE id = ?').get(id);
  return res.json(processQuote(updated));
});

app.delete('/api/quotes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id, title, author, description, source, category, date, tags, notes, userId FROM quotes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  return res.status(204).send();
});

// Movies
app.get('/api/users/:userId/movies', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies WHERE userId = ?').all(userId);
  return res.json(processMovies(rows));
});

app.get('/api/movies', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies').all();
  return res.json(processMovies(rows));
});

app.post('/api/users/:userId/movies', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, director, description, releaseYear, genre, rating, notes } = req.body;
  if (!title || !director || !description) return res.status(400).json({ message: 'Missing required fields' });
  const info = db.prepare('INSERT INTO movies (title, director, description, releaseYear, genre, rating, notes, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(
      title, 
      director, 
      description, 
      releaseYear !== undefined && releaseYear !== '' ? releaseYear : null,
      genre !== undefined && genre !== '' ? genre : null,
      rating !== undefined && rating !== '' ? rating : null,
      notes !== undefined && notes !== '' ? notes : null,
      userId
    );
  const movie = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(processMovie(movie));
});

app.put('/api/movies/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, director, description, releaseYear, genre, rating, notes } = req.body;
  const existing = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('UPDATE movies SET title = ?, director = ?, description = ?, releaseYear = ?, genre = ?, rating = ?, notes = ? WHERE id = ?')
    .run(
      title !== undefined ? title : existing.title,
      director !== undefined ? director : existing.director,
      description !== undefined ? description : existing.description,
      releaseYear !== undefined && releaseYear !== '' ? releaseYear : (releaseYear === '' ? null : existing.releaseYear),
      genre !== undefined && genre !== '' ? genre : (genre === '' ? null : existing.genre),
      rating !== undefined && rating !== '' ? rating : (rating === '' ? null : existing.rating),
      notes !== undefined && notes !== '' ? notes : (notes === '' ? null : existing.notes),
      id
    );
  const updated = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies WHERE id = ?').get(id);
  return res.json(processMovie(updated));
});

app.delete('/api/movies/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id, title, director, description, releaseYear, genre, rating, notes, userId FROM movies WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM movies WHERE id = ?').run(id);
  return res.status(204).send();
});

// Diaries
app.get('/api/users/:userId/diaries', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries WHERE userId = ?').all(userId);
  return res.json(processDiaries(rows));
});

app.get('/api/diaries', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries').all();
  return res.json(processDiaries(rows));
});

app.post('/api/users/:userId/diaries', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, body, createdAt, date, mood, weather, location, tags, privateNotes } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Missing required fields' });
  const timestamp = createdAt || new Date().toISOString();
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const info = db.prepare('INSERT INTO diaries (title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(
      title, 
      body, 
      userId, 
      timestamp, 
      date !== undefined && date !== '' ? date : null,
      mood !== undefined && mood !== '' ? mood : null,
      weather !== undefined && weather !== '' ? weather : null,
      location !== undefined && location !== '' ? location : null,
      tagsJson,
      privateNotes !== undefined && privateNotes !== '' ? privateNotes : null
    );
  const diary = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(processDiary(diary));
});

app.put('/api/diaries/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, body, date, mood, weather, location, tags, privateNotes } = req.body;
  const existing = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  db.prepare('UPDATE diaries SET title = ?, body = ?, date = ?, mood = ?, weather = ?, location = ?, tags = ?, privateNotes = ? WHERE id = ?')
    .run(
      title !== undefined ? title : existing.title,
      body !== undefined ? body : existing.body,
      date !== undefined && date !== '' ? date : (date === '' ? null : existing.date),
      mood !== undefined && mood !== '' ? mood : (mood === '' ? null : existing.mood),
      weather !== undefined && weather !== '' ? weather : (weather === '' ? null : existing.weather),
      location !== undefined && location !== '' ? location : (location === '' ? null : existing.location),
      tags !== undefined ? tagsJson : existing.tags,
      privateNotes !== undefined && privateNotes !== '' ? privateNotes : (privateNotes === '' ? null : existing.privateNotes),
      id
    );
  const updated = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries WHERE id = ?').get(id);
  return res.json(processDiary(updated));
});

app.delete('/api/diaries/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id, title, body, userId, createdAt, date, mood, weather, location, tags, privateNotes FROM diaries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM diaries WHERE id = ?').run(id);
  return res.status(204).send();
});

// Activities routes
app.get('/api/users/:userId/activities', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = db.prepare('SELECT * FROM activities WHERE userId = ?').all(userId);
  return res.json(rows);
});

app.post('/api/users/:userId/activities', authMiddleware, (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, description, category, date, duration, location, status, priority, tags, notes } = req.body;
  if (!title || !description || !category || !date || !status || !priority) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const timestamp = new Date().toISOString();
  
  const info = db.prepare(`
    INSERT INTO activities (title, description, category, date, duration, location, status, priority, tags, notes, userId, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, category, date, duration, location, status, priority, tagsJson, notes, userId, timestamp, timestamp);
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(activity);
});

app.get('/api/activities/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  if (activity.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  return res.json(activity);
});

app.put('/api/activities/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Activity not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  const { title, description, category, date, duration, location, status, priority, tags, notes } = req.body;
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const timestamp = new Date().toISOString();
  
  db.prepare(`
    UPDATE activities SET 
    title = ?, description = ?, category = ?, date = ?, duration = ?, location = ?, 
    status = ?, priority = ?, tags = ?, notes = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    category ?? existing.category,
    date ?? existing.date,
    duration ?? existing.duration,
    location ?? existing.location,
    status ?? existing.status,
    priority ?? existing.priority,
    tagsJson ?? existing.tags,
    notes ?? existing.notes,
    timestamp,
    id
  );
  
  const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  return res.json(updated);
});

app.delete('/api/activities/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'Activity not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  db.prepare('DELETE FROM activities WHERE id = ?').run(id);
  return res.status(204).send();
});
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});


