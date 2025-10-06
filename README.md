
# Exabloom - Backend Technical Test

This project is a high-performance backend system for managing and querying a large-scale contact and messaging database, built with Node.js, Express, and PostgreSQL.

## System Requirements

- Node.js (v16 or later)
- PostgreSQL (v13 or later)
- npm (Node Package Manager)

## Setup Instructions

1.  **Clone the Repository**

    ```bash
    git clone <your-repo-url>
    cd exabloom-backend
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Setup PostgreSQL Database**

    -   Start your PostgreSQL server.
    -   Create a new database. For example, you can name it `exabloom_test_db`.
        ```sql
        CREATE DATABASE exabloom_test_db;
        ```

4.  **Configure Environment Variables**

    -   Create a `.env` file in the root of the project by copying the `.env.example` file.
    -   Update the `.env` file with your PostgreSQL credentials:
        ```
        DB_USER=your_postgres_user
        DB_HOST=localhost
        DB_NAME=exabloom_test_db
        DB_PASSWORD=your_postgres_password
        DB_PORT=5432
        ```

5.  **Initialize the Database Schema**

    -   Run the `init.sql` script to create the necessary tables and indexes. You will need to enable the `pg_trgm` extension, which requires superuser privileges.
        ```bash
        psql -U your_postgres_user -d exabloom_test_db -f init.sql
        ```

6.  **Populate the Database**

    -   Run the data generation script. This will populate the database with 100,000 contacts and 5 million messages. **This process will take a considerable amount of time.**
        ```bash
        npm run populate-db
        ```

7.  **Start the Server**

    -   Once the database is populated, you can start the backend server.
        ```bash
        npm start
        ```
    -   The server will be running at `http://localhost:3000`.

## API Endpoint

### Get Conversations

-   **URL:** `/conversations`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `page` (optional, number): The page number for pagination. Defaults to `1`.
    -   `searchValue` (optional, string): A search term to filter conversations by contact name, phone number, or message content.

-   **Example Usage:**
    -   **Get recent conversations (Page 1):**
        `http://localhost:3000/conversations`
    -   **Get recent conversations (Page 2):**
        `http://localhost:3000/conversations?page=2`
    -   **Search for conversations:**
        `http://localhost:3000/conversations?searchValue=hello`

---

## Video Presentation Guide

This section provides a guide for the required Loom video presentation.

### 1. Demonstrate Query Performance

To demonstrate performance, you can use your browser's Developer Tools (F12 -> Network tab).

-   **Show the Base Query:**
    1.  Open the Network tab.
    2.  Navigate to `http://localhost:3000/conversations`.
    3.  Click on the `conversations` request in the network log.
    4.  **Point out the fast response time** (e.g., under 100ms) despite querying a database with 5 million messages. This shows the efficiency of the base query.

-   **Show the Search Query:**
    1.  Navigate to `http://localhost:3000/conversations?searchValue=and` (or another common word).
    2.  Again, point out the fast response time in the Network tab. This demonstrates the power of the search optimization.

-   **Show Pagination:**
    1.  Quickly navigate through a few pages (`?page=2`, `?page=3`, etc.) to show that pagination is working and remains fast.

### 2. Discuss Optimization Strategies Employed

Here are the key talking points for the optimizations:

-   **The Challenge:** "The primary challenge was ensuring fast query responses from a database containing 5 million messages, especially for search and retrieving recent conversations."

-   **Strategy 1: Efficient Recent Conversation Query:**
    -   "My initial query for recent conversations was timing out because it was trying to scan the entire 5-million-row table. I solved this by refactoring the query to use PostgreSQL's `DISTINCT ON` clause. This is a highly efficient, idiomatic feature that allows the database to find the most recent message for each contact very quickly, often by using indexes directly."

-   **Strategy 2: Advanced Indexing for Search:**
    -   "A simple search using `LIKE` or `ILIKE` would be far too slow. To solve this, I implemented an advanced indexing strategy using the `pg_trgm` extension."
    -   "I created **GIN (Generalized Inverted Index) trigram indexes** on the contact `name` and message `content` columns. These indexes break down the text into small, three-character chunks (trigrams), allowing the database to perform substring searches extremely quickly. This is what makes the `searchValue` feature feel instantaneous, even on millions of records."

### 3. Address Challenges Encountered

-   **Challenge 1: Initial Script Failures**
    -   "Early in the project, the data population script was failing due to TypeScript configuration issues and type errors. I resolved these by correcting the `tsconfig.json` file and adding proper type-safety checks within the script itself."

-   **Challenge 2: API Endpoint Timeout**
    -   "The most significant challenge was when the `/conversations` endpoint was hanging. I diagnosed this as a major performance bottleneck in the SQL query, which was not designed to scale. I overcame this by completely rewriting the query to use `DISTINCT ON`, which reduced the response time from timing-out to taking just a few milliseconds."

-   **Challenge 3: Empty CSV Data**
    -   "The script was initially not reading any data from the `message_content.csv` file. I discovered this was because the CSV parser expected a header row, which the file lacks. I fixed this by configuring the parser to handle a header-less file, which allowed the 85,000+ message snippets to be loaded correctly."
