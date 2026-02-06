# API Contract v1

Base URL
- /api

## Auth

POST /auth/signup
Request
- email
- password

Response
- accessToken
- user
- profileExists
- profileCompleted

POST /auth/login
Request
- email
- password

Response
- accessToken
- user
- profileExists
- profileCompleted

GET /auth/google
Redirect ke Google consent screen.

GET /auth/google/callback
Response dapat berupa redirect ke frontend dengan token di query atau set-cookie.

Recommended approach v1
- Return JWT token via redirect query to frontend.
- Frontend store token in httpOnly cookie if we choose cookie based auth.
- Or store in memory and local storage for simple v1.

## Profiles

GET /profiles/me
Auth required
Response 200
- id
- fullName
- churchName
- contactEmail
- photoUrl
- isCompleted

Response 404
- profile not created.

POST /profiles
Auth required
Request
- fullName
- churchName
- contactEmail optional
- photoUrl optional

Response
- profile

PATCH /profiles/me
Auth required
Request partial
- fullName
- churchName
- contactEmail
- photoUrl
- isCompleted optional true

## Health

GET /health
Response
- ok true
