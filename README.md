# How to run

```shell
npm install
npm run start-seeding
```

# API Documentation

See api documentation in here http://localhost:3000/api-docs after run the server

# Project Overview

This is simple backend server that run as segment generator. It use Node JS as platform, SQL lite as database, and Swagger UI as API documentation. This use layered architecture:
- Model Layer to handle CRUD on database
- Controller Layer to process request from client and return the response
- Route Layer to manage endpoint pathing

Table schema on database/database.js
Seed script on database/seed.js