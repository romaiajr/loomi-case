
# MMORPG Marketplace - Backend

This is the backend for the **Loommerce** project, built with **NestJS** and configured to work with **PostgreSQL**.

## How to Run the Project

### Using Docker

1. Make sure you have **Docker** and **Docker Compose** installed on your system.
2. Run the following command to build and start the containers:

   ```bash
   docker-compose up --build or npm run start:docker
   ```

3. Once running, the following services will be available:
   - **Backend**: [http://localhost:3500](http://localhost:3500)
   - **pgAdmin** (PostgreSQL management interface): [http://localhost:5050](http://localhost:5050)

4. The default PostgreSQL credentials (configured in `docker-compose.yml`) are:
   - **Username**: `postgres`
   - **Password**: `default`
   - **Database**: `loommerce`

> Note: The database configuration is automatically handled when using Docker.

### Running Manually

If you prefer to run the project manually, follow these steps:

1. **Install Dependencies**:
   Ensure you have **Node.js** and **PostgreSQL** installed.

   Install project dependencies:

   ```bash
   npm install
   ```

2. **Set Up the Database**:
   Create a PostgreSQL database with the following configuration:
   - **Database Name**: `loommerce`
   - **Username**: `postgres`
   - **Password**: `postgres`

3. **Set Environment Variables**:
   Create a `.env` file in the root of the project with the following content:

   ```env
   PORT=3500
   DATABASE_NAME=loomerce
   DATABASE_HOST=localhost
   DATABASE_USER=postgres
   DATABASE_PWD=default
   DATABASE_PORT=5432
   ```

4. **Build and Populate the Database**:
   Build the project:

   ```bash
   npm run build
   ```

   <!-- Populate the database:

   ```bash
   npm run populate-db
   ``` -->

5. **Start the Server**:
   Run the server:

   ```bash
   npm run start
   ```

6. **Access the Backend**:
   The server will be available at [http://localhost:3500](http://localhost:3500).

## Environment Variables

The project uses the following environment variables for configuration:

| Variable         | Description                               | Default Value          |
|------------------|-------------------------------------------|------------------------|
| `PORT`           | The port the server will run on          | `3500`                |
| `DATABASE_NAME`  | Name of the PostgreSQL database          | `loomerce`  |
| `DATABASE_HOST`  | Host of the PostgreSQL database          | `localhost`           |
| `DATABASE_USER`  | Username for the PostgreSQL database     | `postgres`            |
| `DATABASE_PWD`   | Password for the PostgreSQL database     | `postgres`             |
| `DATABASE_PORT`  | Port of the PostgreSQL database          | `5432`                |

> Note: Ensure the PostgreSQL is properly configured and that the `.env` file is in place before starting the project manually.