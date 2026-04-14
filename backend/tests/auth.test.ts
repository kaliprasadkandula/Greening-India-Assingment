import request from 'supertest';
import app from '../src/app';
import './setup';

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

describe('POST /auth/register', () => {
  it('creates a user and returns a JWT', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: uniqueEmail(), password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.password).toBeUndefined(); // password must not leak
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: '', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation failed');
    expect(res.body.fields).toBeDefined();
  });

  it('returns 400 when email is already taken', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/register').send({ name: 'Bob', email, password: 'password123' });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Bob2', email, password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.fields.email).toBeDefined();
  });
});

describe('POST /auth/login', () => {
  it('returns a JWT for valid credentials', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/register').send({ name: 'Carol', email, password: 'secret123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid credentials');
  });
});
