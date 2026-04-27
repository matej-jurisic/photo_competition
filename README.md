# PhotoRating

Photo contest management and judging platform. Organise contests, collect photo submissions from photographers, and let judges rate and award them — all from a single self-hosted app.

---

## Features

### Contests

A contest is the top-level container. Define a name, a set of topics, and two deadlines: an upload deadline after which new photos are no longer accepted, and a rating deadline after which judging closes. Mark a contest as complete to make results publicly visible. Attach rewards that are displayed on the results page.

### Topics

Each contest has one or more topics that photos are submitted under. Topics impose structure on submissions — photographers pick a topic when uploading, and judges browse photos grouped by topic.

### Photographers

Photographers are created per contest. Each receives a unique private link (GUID token) they use to upload photos — no account or password required. A photographer can upload one photo per topic and replace or delete it while the upload period is open. Allowed formats: JPG, JPEG, PNG, WebP (max 20 MB).

### Judges

Judges are created per contest and given a private link. During the rating period (after the upload deadline, before the rating deadline) judges rate each photo on a 1–10 scale with an optional comment. Each judge also has three **badges** to award across all photos:

| Badge | Croatian label |
|---|---|
| Color Mastery | Majstorstvo boja |
| Original Idea | Originalna ideja |
| Perfect Moment | Savršen trenutak |
| Made Me Smile | Nasmijalo me |
| Hidden Gem | Skriveni dragulj |

Ratings and badges can be updated any time within the rating period.

### Results

The results page aggregates scores per photographer and topic, computing an overall winner by average score across all submitted photos. Tied photographers are listed when no clear winner exists. Badged photos are surfaced separately with photographer and topic context. Results are gated behind the admin key until the contest is marked complete, then become fully public.

### Admin panel

Manage all contests, topics, photographers, judges, and photos from a single key-protected panel. Create and edit contests, copy judge and photographer links, upload photos on behalf of participants, and mark contests as complete.

---

## Setup & Installation

Requires Docker and Docker Compose.

```bash
cp .env.example .env
# Fill in .env, then:
docker-compose up -d
```

| Service | URL |
|---|---|
| App | http://localhost:3002 |
| Admin | http://localhost:3002/admin |
| API | http://127.0.0.1:5001/api |
| Swagger | http://127.0.0.1:5001/swagger |

Key settings: `POSTGRES_PASSWORD`, `AdminKey`, `AllowedOrigins`, `ConnectionStrings__Default`.

---

## Stack

Backend: .NET 9, ASP.NET Core, Entity Framework Core, PostgreSQL  
Frontend: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query  
Infrastructure: Docker, Nginx
