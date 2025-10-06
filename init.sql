
-- Drop tables if they exist to ensure a clean setup
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS contacts;

-- Create the contacts table
-- This table stores contact information.
-- We''ve added a last_message_timestamp for significant query optimization.
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    last_message_timestamp TIMESTAMP
);

-- Create the messages table
-- This table stores all message content and links to a contact.
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Create indexes for performance
-- Index on contacts(phone_number) for faster lookups.
CREATE INDEX idx_contacts_phone_number ON contacts(phone_number);

-- Index on contacts(last_message_timestamp) for fast retrieval of recent conversations.
CREATE INDEX idx_contacts_last_message_timestamp ON contacts(last_message_timestamp DESC);

-- Composite index on messages(contact_id, timestamp) for fetching a contact''s messages.
CREATE INDEX idx_messages_contact_id_timestamp ON messages(contact_id, timestamp DESC);

-- Index on messages(timestamp) for ordering all messages by time.
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- Enable pg_trgm extension for trigram indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN trigram index for contact name searching
CREATE INDEX idx_contacts_name_gin ON contacts USING GIN (name gin_trgm_ops);

-- Add GIN trigram index for message content searching
CREATE INDEX idx_messages_content_gin ON messages USING GIN (content gin_trgm_ops);
