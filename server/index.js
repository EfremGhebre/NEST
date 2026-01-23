const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const DATABASE_URL = process.env.DATABASE_URL;

app.use(cors());
app.use(express.json());

if (!DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Configure it with your Supabase Postgres URL.');
}

const ssl = DATABASE_URL && (DATABASE_URL.includes('supabase.co') || DATABASE_URL.includes('sslmode=require'))
  ? { rejectUnauthorized: false }
  : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl
});

async function ensureColumn(table, column, type) {
  await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      director TEXT NOT NULL,
      description TEXT NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS diaries (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "createdAt" TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
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
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "createdAt" TEXT,
      "updatedAt" TEXT
    );
  `);

  await ensureColumn('quotes', '"source"', 'TEXT');
  await ensureColumn('quotes', '"category"', 'TEXT');
  await ensureColumn('quotes', '"date"', 'TEXT');
  await ensureColumn('quotes', '"tags"', 'TEXT');
  await ensureColumn('quotes', '"notes"', 'TEXT');

  await ensureColumn('movies', '"releaseYear"', 'INTEGER');
  await ensureColumn('movies', '"genre"', 'TEXT');
  await ensureColumn('movies', '"rating"', 'TEXT');
  await ensureColumn('movies', '"notes"', 'TEXT');

  await ensureColumn('diaries', '"date"', 'TEXT');
  await ensureColumn('diaries', '"mood"', 'TEXT');
  await ensureColumn('diaries', '"weather"', 'TEXT');
  await ensureColumn('diaries', '"location"', 'TEXT');
  await ensureColumn('diaries', '"tags"', 'TEXT');
  await ensureColumn('diaries', '"privateNotes"', 'TEXT');
  await ensureColumn('diaries', '"createdAt"', 'TEXT');

  await ensureColumn('books', '"publicationYear"', 'INTEGER');
  await ensureColumn('books', '"genre"', 'TEXT');
  await ensureColumn('books', '"rating"', 'TEXT');
  await ensureColumn('books', '"pages"', 'INTEGER');
  await ensureColumn('books', '"status"', 'TEXT');
  await ensureColumn('books', '"tags"', 'TEXT');
  await ensureColumn('books', '"notes"', 'TEXT');
  await ensureColumn('books', '"createdAt"', 'TEXT');
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

async function dbGet(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

async function dbAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
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
    createdAt: book.createdAt !== undefined ? book.createdAt : null,
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
app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const existing = await dbGet('SELECT id FROM users WHERE name = $1 OR email = $2', [name, email]);
    if (existing) return res.status(400).json({ message: 'User already exists.' });
    const passwordHash = bcrypt.hashSync(password, 10);
    const inserted = await dbGet(
      'INSERT INTO users (name, email, "passwordHash") VALUES ($1, $2, $3) RETURNING id',
      [name, email, passwordHash]
    );
    const user = { id: inserted.id, name };
    const token = createToken(user);
    return res.json({ token, userId: user.id });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await dbGet('SELECT id, name, "passwordHash" FROM users WHERE name = $1', [name]);
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
app.get('/api/users/:userId/books', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = await dbAll(
    'SELECT id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "createdAt", "userId" FROM books WHERE "userId" = $1',
    [userId]
  );
  return res.json(processBooks(rows));
});

app.get('/api/books', authMiddleware, async (req, res) => {
  const rows = await dbAll('SELECT id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "createdAt", "userId" FROM books');
  return res.json(processBooks(rows));
});

app.post('/api/users/:userId/books', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, author, description, publicationYear, genre, rating, pages, status, tags, notes } = req.body;
  console.log('Received book data:', req.body);
  console.log('Extracted fields:', { title, author, description, publicationYear, genre, rating, pages, status, tags, notes });
  if (!title || !author || !description) return res.status(400).json({ message: 'Missing required fields' });
  
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  console.log('Tags JSON:', tagsJson);
  
  const createdAt = new Date().toISOString();
  const book = await dbGet(
    'INSERT INTO books (title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "userId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "createdAt", "userId"',
    [
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
      userId,
      createdAt
    ]
  );
  const processed = processBook(book);
  return res.status(201).json(processed);
});

app.put('/api/books/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, author, description, publicationYear, genre, rating, pages, status, tags, notes } = req.body;
  const existing = await dbGet(
    'SELECT id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "createdAt", "userId" FROM books WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  await pool.query(
    'UPDATE books SET title = $1, author = $2, description = $3, "publicationYear" = $4, genre = $5, rating = $6, pages = $7, status = $8, tags = $9, notes = $10 WHERE id = $11',
    [
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
    ]
  );
  const updated = await dbGet(
    'SELECT id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "createdAt", "userId" FROM books WHERE id = $1',
    [id]
  );
  return res.json(processBook(updated));
});

app.delete('/api/books/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet(
    'SELECT id, title, author, description, "publicationYear", genre, rating, pages, status, tags, notes, "userId" FROM books WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM books WHERE id = $1', [id]);
  return res.status(204).send();
});

// Quotes
app.get('/api/users/:userId/quotes', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = await dbAll(
    'SELECT id, title, author, description, source, category, "date", tags, notes, "userId" FROM quotes WHERE "userId" = $1',
    [userId]
  );
  return res.json(processQuotes(rows));
});

app.get('/api/quotes', authMiddleware, async (req, res) => {
  const rows = await dbAll('SELECT id, title, author, description, source, category, "date", tags, notes, "userId" FROM quotes');
  return res.json(processQuotes(rows));
});

app.post('/api/users/:userId/quotes', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, author, description, source, category, date, tags, notes } = req.body;
  if (!title || !author || !description) return res.status(400).json({ message: 'Missing required fields' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const quote = await dbGet(
    'INSERT INTO quotes (title, author, description, source, category, "date", tags, notes, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, title, author, description, source, category, "date", tags, notes, "userId"',
    [
      title,
      author,
      description,
      source !== undefined && source !== '' ? source : null,
      category !== undefined && category !== '' ? category : null,
      date !== undefined && date !== '' ? date : null,
      tagsJson,
      notes !== undefined && notes !== '' ? notes : null,
      userId
    ]
  );
  return res.status(201).json(processQuote(quote));
});

app.put('/api/quotes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, author, description, source, category, date, tags, notes } = req.body;
  const existing = await dbGet(
    'SELECT id, title, author, description, source, category, "date", tags, notes, "userId" FROM quotes WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  await pool.query(
    'UPDATE quotes SET title = $1, author = $2, description = $3, source = $4, category = $5, "date" = $6, tags = $7, notes = $8 WHERE id = $9',
    [
      title !== undefined ? title : existing.title,
      author !== undefined ? author : existing.author,
      description !== undefined ? description : existing.description,
      source !== undefined && source !== '' ? source : (source === '' ? null : existing.source),
      category !== undefined && category !== '' ? category : (category === '' ? null : existing.category),
      date !== undefined && date !== '' ? date : (date === '' ? null : existing.date),
      tags !== undefined ? tagsJson : existing.tags,
      notes !== undefined && notes !== '' ? notes : (notes === '' ? null : existing.notes),
      id
    ]
  );
  const updated = await dbGet(
    'SELECT id, title, author, description, source, category, "date", tags, notes, "userId" FROM quotes WHERE id = $1',
    [id]
  );
  return res.json(processQuote(updated));
});

app.delete('/api/quotes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet(
    'SELECT id, title, author, description, source, category, "date", tags, notes, "userId" FROM quotes WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM quotes WHERE id = $1', [id]);
  return res.status(204).send();
});

// Movies
app.get('/api/users/:userId/movies', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = await dbAll(
    'SELECT id, title, director, description, "releaseYear", genre, rating, notes, "userId" FROM movies WHERE "userId" = $1',
    [userId]
  );
  return res.json(processMovies(rows));
});

app.get('/api/movies', authMiddleware, async (req, res) => {
  const rows = await dbAll('SELECT id, title, director, description, "releaseYear", genre, rating, notes, "userId" FROM movies');
  return res.json(processMovies(rows));
});

app.post('/api/users/:userId/movies', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, director, description, releaseYear, genre, rating, notes } = req.body;
  if (!title || !director || !description) return res.status(400).json({ message: 'Missing required fields' });
  const movie = await dbGet(
    'INSERT INTO movies (title, director, description, "releaseYear", genre, rating, notes, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title, director, description, "releaseYear", genre, rating, notes, "userId"',
    [
      title,
      director,
      description,
      releaseYear !== undefined && releaseYear !== '' ? releaseYear : null,
      genre !== undefined && genre !== '' ? genre : null,
      rating !== undefined && rating !== '' ? rating : null,
      notes !== undefined && notes !== '' ? notes : null,
      userId
    ]
  );
  return res.status(201).json(processMovie(movie));
});

app.put('/api/movies/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, director, description, releaseYear, genre, rating, notes } = req.body;
  const existing = await dbGet(
    'SELECT id, title, director, description, "releaseYear", genre, rating, notes, "userId" FROM movies WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query(
    'UPDATE movies SET title = $1, director = $2, description = $3, "releaseYear" = $4, genre = $5, rating = $6, notes = $7 WHERE id = $8',
    [
      title !== undefined ? title : existing.title,
      director !== undefined ? director : existing.director,
      description !== undefined ? description : existing.description,
      releaseYear !== undefined && releaseYear !== '' ? releaseYear : (releaseYear === '' ? null : existing.releaseYear),
      genre !== undefined && genre !== '' ? genre : (genre === '' ? null : existing.genre),
      rating !== undefined && rating !== '' ? rating : (rating === '' ? null : existing.rating),
      notes !== undefined && notes !== '' ? notes : (notes === '' ? null : existing.notes),
      id
    ]
  );
  const updated = await dbGet(
    'SELECT id, title, director, description, "releaseYear", genre, rating, notes, "userId" FROM movies WHERE id = $1',
    [id]
  );
  return res.json(processMovie(updated));
});

app.delete('/api/movies/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet(
    'SELECT id, title, director, description, "releaseYear", genre, rating, notes, "userId" FROM movies WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM movies WHERE id = $1', [id]);
  return res.status(204).send();
});

// Diaries
app.get('/api/users/:userId/diaries', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = await dbAll(
    'SELECT id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes" FROM diaries WHERE "userId" = $1',
    [userId]
  );
  return res.json(processDiaries(rows));
});

app.get('/api/diaries', authMiddleware, async (req, res) => {
  const rows = await dbAll('SELECT id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes" FROM diaries');
  return res.json(processDiaries(rows));
});

app.post('/api/users/:userId/diaries', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, body, createdAt, date, mood, weather, location, tags, privateNotes } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Missing required fields' });
  const timestamp = createdAt || new Date().toISOString();
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const diary = await dbGet(
    'INSERT INTO diaries (title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes"',
    [
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
    ]
  );
  return res.status(201).json(processDiary(diary));
});

app.put('/api/diaries/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, body, date, mood, weather, location, tags, privateNotes } = req.body;
  const existing = await dbGet(
    'SELECT id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes" FROM diaries WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  await pool.query(
    'UPDATE diaries SET title = $1, body = $2, "date" = $3, mood = $4, weather = $5, location = $6, tags = $7, "privateNotes" = $8 WHERE id = $9',
    [
      title !== undefined ? title : existing.title,
      body !== undefined ? body : existing.body,
      date !== undefined && date !== '' ? date : (date === '' ? null : existing.date),
      mood !== undefined && mood !== '' ? mood : (mood === '' ? null : existing.mood),
      weather !== undefined && weather !== '' ? weather : (weather === '' ? null : existing.weather),
      location !== undefined && location !== '' ? location : (location === '' ? null : existing.location),
      tags !== undefined ? tagsJson : existing.tags,
      privateNotes !== undefined && privateNotes !== '' ? privateNotes : (privateNotes === '' ? null : existing.privateNotes),
      id
    ]
  );
  const updated = await dbGet(
    'SELECT id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes" FROM diaries WHERE id = $1',
    [id]
  );
  return res.json(processDiary(updated));
});

app.delete('/api/diaries/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet(
    'SELECT id, title, body, "userId", "createdAt", "date", mood, weather, location, tags, "privateNotes" FROM diaries WHERE id = $1',
    [id]
  );
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM diaries WHERE id = $1', [id]);
  return res.status(204).send();
});

// Activities routes
app.get('/api/users/:userId/activities', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const rows = await dbAll('SELECT * FROM activities WHERE "userId" = $1', [userId]);
  return res.json(rows);
});

app.post('/api/users/:userId/activities', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  const { title, description, category, date, duration, location, status, priority, tags, notes } = req.body;
  if (!title || !description || !category || !date || !status || !priority) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const timestamp = new Date().toISOString();
  
  const activity = await dbGet(
    `
    INSERT INTO activities (title, description, category, date, duration, location, status, priority, tags, notes, "userId", "createdAt", "updatedAt") 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
    `,
    [title, description, category, date, duration, location, status, priority, tagsJson, notes, userId, timestamp, timestamp]
  );
  
  return res.status(201).json(activity);
});

app.get('/api/activities/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const activity = await dbGet('SELECT * FROM activities WHERE id = $1', [id]);
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  if (activity.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  return res.json(activity);
});

app.put('/api/activities/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet('SELECT * FROM activities WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ message: 'Activity not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  
  const { title, description, category, date, duration, location, status, priority, tags, notes } = req.body;
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : (tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null);
  const timestamp = new Date().toISOString();
  
  await pool.query(
    `
    UPDATE activities SET 
    title = $1, description = $2, category = $3, date = $4, duration = $5, location = $6, 
    status = $7, priority = $8, tags = $9, notes = $10, "updatedAt" = $11
    WHERE id = $12
    `,
    [
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
    ]
  );
  
  const updated = await dbGet('SELECT * FROM activities WHERE id = $1', [id]);
  return res.json(updated);
});

app.delete('/api/activities/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await dbGet('SELECT * FROM activities WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ message: 'Activity not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM activities WHERE id = $1', [id]);
  return res.status(204).send();
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  }
}

start();


