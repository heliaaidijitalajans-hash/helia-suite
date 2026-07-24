# Helia Cloud

Independent multi-tenant gateway for Helia customers.

Helia Core remains a separate operational platform. Helia Cloud manages users, organizations, projects, API keys, plans, and usage.

## Start

```bash
npm run cloud:dev
# default http://localhost:4091
```

## Dashboard (JWT)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Email verification |
| GET | `/me` | Current user + orgs/projects |
| GET/POST | `/organizations` | List / create organizations |
| GET/POST | `/projects` | List / create projects |
| GET/POST | `/apikeys` | List / create API keys |
| DELETE | `/apikeys/:id` | Delete API key |
| GET | `/usage` | Monthly usage |
| GET | `/plans` | Subscription plans |

## External apps (API key)

```http
Authorization: Bearer hl_live_xxxxxxxxxxxxx
GET /v1/whoami
```

Helia resolves organization, project, permissions, plan, and usage automatically.

## Plans

Free · Starter · Professional · Business · Enterprise

Billing provider is intentionally not connected — architecture only (`billingProvider: "none"`).
