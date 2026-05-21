import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

class Database {
    static #instance = null;
    #pool;
    
    constructor() {
        if (Database.#instance) {
            return Database.#instance;
        }
        
        this.#pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'codeAlong_Database_local',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASS || '11056149',
        });
        
        Database.#instance = this;
    }
    
    getPool() {
        return this.#pool;
    }
    
    // Generic query helper (optional)
    async query(text, params = []) {
        const client = await this.#pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }
    
    // Transaction helpers
    async getClient() {
        return await this.#pool.connect();
    }
}

export default new Database();
