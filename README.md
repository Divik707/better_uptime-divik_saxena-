# Better Uptime

A distributed uptime monitoring service built with TypeScript, Bun, Redis Streams, Prisma, and PostgreSQL.

Users can register websites, and the system continuously checks their availability from different worker regions. Every website check is recorded with response time metrics and status information.

## Features

* Add and manage websites to monitor
* Distributed website checking using Redis Streams
* Worker-based architecture
* Response time tracking
* Website status monitoring (UP / DOWN)
* PostgreSQL database with Prisma ORM
* Consumer Groups for horizontal scaling
* Region-based monitoring support
* Built with Bun and TypeScript

---

## Architecture

```text
User
  |
  v
API Server
  |
  v
PostgreSQL
  |
  v
Pusher Service
  |
  v
Redis Stream
  |
  +----------------+
  |                |
  v                v
Worker 1      Worker 2
  |                |
  +-------+--------+
          |
          v
Website Checks
          |
          v
Website Tick Records
```

---

## Tech Stack

* TypeScript
* Bun
* PostgreSQL
* Prisma
* Redis Streams
* Axios
* Express

---

## Monorepo Structure

```text
apps/
├── api/
├── pusher/
└── worker/

packages/
├── database/
└── redisStreams/
```

### API

Handles website creation and management.

### Pusher

Reads websites from the database and pushes monitoring jobs into Redis Streams.

### Worker

Consumes jobs from Redis Consumer Groups and performs website health checks.

### Database Package

Contains Prisma schema and database client.

### RedisStreams Package

Contains Redis Stream helper functions such as:

* XADD
* XREADGROUP
* XACK

---

## Environment Variables

### Worker

```env
REGION_ID=mumbai
WORKER_ID=worker-1
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

### API

```env
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
JWT_SECRET=your_secret
```

### Pusher

```env
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/betteruptime.git
cd betteruptime
```

Install dependencies:

```bash
bun install
```

---

## Database Setup

Generate Prisma Client:

```bash
bunx prisma generate
```

Run migrations:

```bash
bunx prisma migrate dev
```

---

## Running the Services

### Start API

```bash
cd apps/api
bun run index.ts
```

### Start Pusher

```bash
cd apps/pusher
bun run index.ts
```

### Start Worker

```bash
cd apps/worker
bun run index.ts
```

---

## Website Monitoring Flow

1. User adds a website.
2. Website is stored in PostgreSQL.
3. Pusher periodically reads websites from the database.
4. Pusher adds website jobs to Redis Streams.
5. Workers consume jobs using Redis Consumer Groups.
6. Workers check website availability using Axios.
7. Response time and status are stored in the database.
8. Future notification services can trigger alerts for DOWN websites.

---

## Future Improvements

* Email notifications
* WhatsApp notifications
* SMS alerts
* Dashboard with uptime statistics
* Region-wise monitoring
* Historical uptime reports
* Incident tracking
* Public status pages

---

## Author

Built by Divik as a distributed systems and backend engineering project.
