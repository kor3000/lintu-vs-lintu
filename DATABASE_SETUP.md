# PostgreSQL Database Setup

This project uses Prisma ORM with PostgreSQL as the database.

## Prerequisites

- PostgreSQL installed and running
- Node.js 16+ installed

## Setup Instructions

### 1. Install PostgreSQL

If you haven't already, install PostgreSQL:
- Windows: Download from https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

### 2. Create a Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create a new database
CREATE DATABASE lintu_vs_lintu;

# Exit psql
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and update with your database credentials:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/lintu_vs_lintu"
```

### 4. Run Database Migrations

```bash
# Create tables based on your Prisma schema
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. View Your Database (Optional)

Open Prisma Studio to browse your database:

```bash
npx prisma studio
```

## Usage in Your Application

### Using the Prisma Client

Import the database client in your API routes or server components:

```typescript
import { prisma } from "@/lib/db";

// Example: Create a record
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Example: Fetch records
const users = await prisma.user.findMany();

// Example: Update a record
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: "Jane Doe" },
});

// Example: Delete a record
await prisma.user.delete({
  where: { id: 1 },
});
```

## Defining Models

Edit `prisma/schema.prisma` to define your database models. Here's an example:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
  content String?
  author User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

After updating the schema, run:

```bash
npx prisma migrate dev --name <migration_name>
```

## Testing Database Connection

Visit `http://localhost:3000/api/db-test` to test if your database connection is working.

## Documentation

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
