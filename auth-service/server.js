const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const PORT = process.env.PORT || 3000;

// User registration
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 8);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, email]
    );
    console.log("result", result)
    res.status(201).send({ userId: result.rows[0].id });
  } catch (error) {
    console.log("error", error)

    res.status(500).send('Failed to register user');
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (user.rows.length > 0) {
      const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!isValid) {
        return res.status(401).send('Authentication failed');
      }

      const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.send({ jwt: token });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Login error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
