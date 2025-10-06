
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

const NUM_CONTACTS = 100000;
const NUM_MESSAGES = 5000000;
const BATCH_SIZE = 10000;

const messageContents: string[] = [];

async function readCsv(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('Reading message content from CSV...');
        fs.createReadStream('message_content.csv')
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
                const content = row[0];
                if (content) {
                    messageContents.push(content);
                }
            })
            .on('end', () => {
                console.log(`CSV file successfully processed. Found ${messageContents.length} message snippets.`);
                resolve();
            })
            .on('error', reject);
    });
}

async function generateContacts() {
    console.log(`Generating ${NUM_CONTACTS} contacts...`);
    const client = await pool.connect();
    try {
        for (let i = 0; i < NUM_CONTACTS; i += BATCH_SIZE) {
            const contacts = [];
            for (let j = 0; j < BATCH_SIZE && (i + j) < NUM_CONTACTS; j++) {
                const name = faker.person.fullName();
                const phone_number = faker.phone.number();
                contacts.push([name, phone_number]);
            }

            const values = contacts.map(c => `('${(c[0] as string).replace(/'/g, "''")}', '${c[1]}')`).join(',');
            await client.query(`INSERT INTO contacts (name, phone_number) VALUES ${values}`);
            console.log(`Inserted contacts ${i + contacts.length}/${NUM_CONTACTS}`);
        }
    } finally {
        client.release();
    }
    console.log('Finished generating contacts.');
}

async function generateMessages() {
    console.log(`Generating ${NUM_MESSAGES} messages...`);
    if (messageContents.length === 0) {
        throw new Error("No message content available. Did the CSV read fail?");
    }
    const client = await pool.connect();
    try {
        for (let i = 0; i < NUM_MESSAGES; i += BATCH_SIZE) {
            const messages = [];
            for (let j = 0; j < BATCH_SIZE && (i + j) < NUM_MESSAGES; j++) {
                const contact_id = Math.floor(Math.random() * NUM_CONTACTS) + 1;
                const content = messageContents[Math.floor(Math.random() * messageContents.length)];
                const timestamp = faker.date.between({ from: '2022-01-01T00:00:00.000Z', to: '2024-01-01T00:00:00.000Z' }).toISOString();
                messages.push([contact_id, content, timestamp]);
            }
            const values = messages.map(m => `(${m[0]}, '${(m[1] as string).replace(/'/g, "''")}', '${m[2]}')`).join(',');
            await client.query(`INSERT INTO messages (contact_id, content, timestamp) VALUES ${values}`);
            console.log(`Inserted messages ${i + messages.length}/${NUM_MESSAGES}`);
        }
    } finally {
        client.release();
    }
    console.log('Finished generating messages.');
}

async function updateContactTimestamps() {
    console.log('Updating contact last_message_timestamp...');
    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE contacts c
            SET last_message_timestamp = m.max_ts
            FROM (
                SELECT contact_id, MAX(timestamp) as max_ts
                FROM messages
                GROUP BY contact_id
            ) m
            WHERE c.id = m.contact_id;
        `);
    } finally {
        client.release();
    }
    console.log('Finished updating timestamps.');
}


async function main() {
    try {
        await readCsv();
        await generateContacts();
        await generateMessages();
        await updateContactTimestamps();
        console.log('Database population complete!');
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await pool.end();
    }
}

main();
