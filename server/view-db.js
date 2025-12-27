const Database = require('better-sqlite3');
const path = require('path');

// Try to connect to the database
let db;
try {
  // First try the local database
  db = new Database('bnq.db');
  console.log('Connected to bnq.db');
} catch (error) {
  try {
    // If that fails, try the parent directory database
    db = new Database(path.join(__dirname, '..', 'bnq.db'));
    console.log('Connected to ../bnq.db');
  } catch (error2) {
    console.error('Could not connect to database:', error2.message);
    process.exit(1);
  }
}

console.log('\n=== DATABASE RECORDS ===\n');

// View all tables
console.log('📋 Available Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

console.log('\n' + '='.repeat(50));

// View Users table
console.log('\n👥 USERS TABLE:');
try {
  const users = db.prepare('SELECT id, name, email FROM users').all();
  if (users.length === 0) {
    console.log('  No users found');
  } else {
    console.log(`  Found ${users.length} user(s):`);
    users.forEach(user => {
      console.log(`    ID: ${user.id} | Name: ${user.name} | Email: ${user.email}`);
    });
  }
} catch (error) {
  console.log('  Error reading users:', error.message);
}

// View Books table
console.log('\n📚 BOOKS TABLE:');
try {
  const books = db.prepare('SELECT id, title, author, description, userId FROM books').all();
  if (books.length === 0) {
    console.log('  No books found');
  } else {
    console.log(`  Found ${books.length} book(s):`);
    books.forEach(book => {
      console.log(`    ID: ${book.id} | Title: "${book.title}" | Author: ${book.author} | User ID: ${book.userId}`);
      console.log(`         Description: ${book.description.substring(0, 100)}${book.description.length > 100 ? '...' : ''}`);
    });
  }
} catch (error) {
  console.log('  Error reading books:', error.message);
}

// View Quotes table
console.log('\n💬 QUOTES TABLE:');
try {
  const quotes = db.prepare('SELECT id, title, author, description, userId FROM quotes').all();
  if (quotes.length === 0) {
    console.log('  No quotes found');
  } else {
    console.log(`  Found ${quotes.length} quote(s):`);
    quotes.forEach(quote => {
      console.log(`    ID: ${quote.id} | Title: "${quote.title}" | Author: ${quote.author} | User ID: ${quote.userId}`);
      console.log(`         Description: ${quote.description.substring(0, 100)}${quote.description.length > 100 ? '...' : ''}`);
    });
  }
} catch (error) {
  console.log('  Error reading quotes:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Database inspection complete!');

db.close();
