
import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Exabloom Backend</h1><p>Server is running correctly.</p><p>Use the <code>/conversations</code> endpoint to fetch data.</p><p><b>Example:</b> <a href="/conversations">/conversations</a></p>');
});

app.get('/conversations', async (req, res) => {
    const page = parseInt(req.query.page as string || '1');
    const searchValue = req.query.searchValue as string || '';
    const limit = 50;
    const offset = (page - 1) * limit;

    try {
        let query;
        let queryParams;

        if (searchValue) {
            // Query with search functionality
            query = `
                WITH ranked_messages AS (
                    SELECT
                        m.id AS message_id,
                        m.content,
                        m.timestamp,
                        c.id AS contact_id,
                        c.name,
                        c.phone_number,
                        ROW_NUMBER() OVER(PARTITION BY c.id ORDER BY m.timestamp DESC) as rn
                    FROM
                        contacts c
                    JOIN
                        messages m ON c.id = m.contact_id
                    WHERE
                        c.name ILIKE $1 OR
                        c.phone_number ILIKE $1 OR
                        m.content ILIKE $1
                )
                SELECT
                    message_id,
                    content,
                    timestamp,
                    contact_id,
                    name,
                    phone_number
                FROM
                    ranked_messages
                WHERE
                    rn = 1
                ORDER BY
                    timestamp DESC
                LIMIT $2
                OFFSET $3;
            `;
            queryParams = [`%${searchValue}%`, limit, offset];
        } else {
            // Original query for recent conversations
            query = `
                SELECT * FROM (
                    SELECT DISTINCT ON (contact_id)
                        m.id as message_id,
                        m.content,
                        m.timestamp,
                        m.contact_id,
                        c.name,
                        c.phone_number
                    FROM messages m
                    JOIN contacts c on m.contact_id = c.id
                    ORDER BY contact_id, timestamp DESC
                ) as latest_messages
                ORDER BY timestamp DESC
                LIMIT $1 OFFSET $2;
            `;
            queryParams = [limit, offset];
        }

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
