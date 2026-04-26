import database from '../config/database.js';

class UserModel {
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await database.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  async findByGoogleId(googleId) {
    try {
      const query = 'SELECT * FROM users WHERE google_id = $1';
      const result = await database.query(query, [googleId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByGoogleId:', error);
      throw error;
    }
  }

  async findUserByID(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findUserByID:', error);
      throw error;
    }
  }

  async createUser(userData) {
    const {
      username,
      email,
      password_hash = null,
      auth_provider = 'email',
      google_id = null,
    } = userData;

    try {
      const query = `
        INSERT INTO users (username, email, password_hash, auth_provider, google_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, username, email, auth_provider, google_id, created_at
      `;

      const values = [username, email, password_hash, auth_provider, google_id];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateLastLogin(id) {
    try {
      const query = `
        UPDATE users
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING id, username, email, auth_provider, google_id, last_login, updated_at
      `;

      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      throw error;
    }
  }

  async update(id, updates) {
    try {
      const allowedFields = ['username', 'email', 'password_hash', 'auth_provider', 'google_id'];
      const entries = Object.entries(updates).filter(([key]) => allowedFields.includes(key));

      if (entries.length === 0) {
        return this.findUserByID(id);
      }

      const setValues = entries.map(([key], index) => `${key} = $${index + 1}`);
      const values = entries.map(([, value]) => value);

      values.push(id);

      const query = `
        UPDATE users
        SET ${setValues.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, username, email, auth_provider, google_id, created_at, updated_at, last_login
      `;

      const result = await database.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }
}

export default new UserModel();
