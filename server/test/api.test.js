const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

const dbPath = path.join(os.tmpdir(), `nest-test-${Date.now()}.db`);
process.env.DB_ENGINE = 'sqlite';
process.env.DB_PATH = dbPath;
process.env.JWT_SECRET = 'test-secret';

const { app, initDb } = require('../index');

let server;
let baseUrl;

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      body = text;
    }
  }
  return { response, body };
}

test.before(async () => {
  await initDb();
  await new Promise(resolve => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('supports login with username or email', async () => {
  const registerPayload = {
    name: 'testUser1',
    email: 'test-user1@example.com',
    password: 'password123'
  };
  const register = await requestJson(`${baseUrl}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  });
  assert.equal(register.response.status, 200);
  assert.ok(register.body.token);

  const byUsername = await requestJson(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: registerPayload.name, password: registerPayload.password })
  });
  assert.equal(byUsername.response.status, 200);
  assert.ok(byUsername.body.token);

  const byEmail = await requestJson(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: registerPayload.email, password: registerPayload.password })
  });
  assert.equal(byEmail.response.status, 200);
  assert.ok(byEmail.body.token);
});

test('profile and subscription lifecycle works', async () => {
  const registerPayload = {
    name: 'testUser2',
    email: 'test-user2@example.com',
    password: 'password123'
  };
  const register = await requestJson(`${baseUrl}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  });
  assert.equal(register.response.status, 200);
  const token = register.body.token;
  const userId = register.body.userId;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const profileUpdate = await requestJson(`${baseUrl}/users/${userId}/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      username: 'updatedUser2',
      firstName: 'Updated',
      lastName: 'Name',
      email: 'updated-user2@example.com'
    })
  });
  assert.equal(profileUpdate.response.status, 200);
  assert.equal(profileUpdate.body.username, 'updatedUser2');

  const subscriptionSave = await requestJson(`${baseUrl}/users/${userId}/subscription`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      planName: 'Pro Plan',
      status: 'active',
      startDate: '2026-07-01',
      renewalDate: '2026-08-01',
      monthlyCost: 12.5,
      billingCycle: 'monthly',
      notes: 'Test note'
    })
  });
  assert.equal(subscriptionSave.response.status, 200);
  assert.equal(subscriptionSave.body.planName, 'Pro Plan');

  const subscriptionGet = await requestJson(`${baseUrl}/users/${userId}/subscription`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(subscriptionGet.response.status, 200);
  assert.equal(subscriptionGet.body.planName, 'Pro Plan');

  const subscriptionDelete = await requestJson(`${baseUrl}/users/${userId}/subscription`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(subscriptionDelete.response.status, 204);

  const deleteAccount = await requestJson(`${baseUrl}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(deleteAccount.response.status, 204);

  const loginAfterDelete = await requestJson(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'updatedUser2', password: registerPayload.password })
  });
  assert.equal(loginAfterDelete.response.status, 401);
});

test('global collection endpoints only return authenticated user records', async () => {
  const registerA = await requestJson(`${baseUrl}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ownerA',
      email: 'owner-a@example.com',
      password: 'password123'
    })
  });
  assert.equal(registerA.response.status, 200);

  const registerB = await requestJson(`${baseUrl}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ownerB',
      email: 'owner-b@example.com',
      password: 'password123'
    })
  });
  assert.equal(registerB.response.status, 200);

  const userAId = registerA.body.userId;
  const userBId = registerB.body.userId;
  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${registerA.body.token}`
  };
  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${registerB.body.token}`
  };

  await requestJson(`${baseUrl}/users/${userAId}/books`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ title: 'A Book', author: 'A Author', description: 'A Description' })
  });
  await requestJson(`${baseUrl}/users/${userBId}/books`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({ title: 'B Book', author: 'B Author', description: 'B Description' })
  });

  await requestJson(`${baseUrl}/users/${userAId}/quotes`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ title: 'A Quote', author: 'A Author', description: 'A Quote Description' })
  });
  await requestJson(`${baseUrl}/users/${userBId}/quotes`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({ title: 'B Quote', author: 'B Author', description: 'B Quote Description' })
  });

  await requestJson(`${baseUrl}/users/${userAId}/movies`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ title: 'A Movie', director: 'A Director', description: 'A Movie Description' })
  });
  await requestJson(`${baseUrl}/users/${userBId}/movies`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({ title: 'B Movie', director: 'B Director', description: 'B Movie Description' })
  });

  await requestJson(`${baseUrl}/users/${userAId}/diaries`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ title: 'A Diary', body: 'A Diary body' })
  });
  await requestJson(`${baseUrl}/users/${userBId}/diaries`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({ title: 'B Diary', body: 'B Diary body' })
  });

  const booksA = await requestJson(`${baseUrl}/books`, {
    headers: { Authorization: `Bearer ${registerA.body.token}` }
  });
  assert.equal(booksA.response.status, 200);
  assert.equal(booksA.body.length, 1);
  assert.ok(booksA.body.every(book => Number(book.userId) === Number(userAId)));

  const quotesA = await requestJson(`${baseUrl}/quotes`, {
    headers: { Authorization: `Bearer ${registerA.body.token}` }
  });
  assert.equal(quotesA.response.status, 200);
  assert.equal(quotesA.body.length, 1);
  assert.ok(quotesA.body.every(quote => Number(quote.userId) === Number(userAId)));

  const moviesA = await requestJson(`${baseUrl}/movies`, {
    headers: { Authorization: `Bearer ${registerA.body.token}` }
  });
  assert.equal(moviesA.response.status, 200);
  assert.equal(moviesA.body.length, 1);
  assert.ok(moviesA.body.every(movie => Number(movie.userId) === Number(userAId)));

  const diariesA = await requestJson(`${baseUrl}/diaries`, {
    headers: { Authorization: `Bearer ${registerA.body.token}` }
  });
  assert.equal(diariesA.response.status, 200);
  assert.equal(diariesA.body.length, 1);
  assert.ok(diariesA.body.every(diary => Number(diary.userId) === Number(userAId)));
});
