# BarberBook — Barbershop Management System

A role-based platform for barbershop operations, covering a public-facing booking site,
appointment scheduling, session handling, billing, and business reporting across four
user roles.

🔗 **Live demo:** https://barberbook76.vercel.app
🔗 **Backend API:** https://barberbook-8v3l.onrender.com

## Key Features

- **Modern, professionally designed landing page:** a polished public front page showcasing
  the shop, team, and portfolio of work — built to feel like a real business website, not
  just an internal tool.
- **Public landing page:** Customers can browse shop info, view the team and their work,
  and book an appointment directly from the website — no account required to start.
- **Role-based access control** for Admin, Barber, Receptionist, and Customer, enforced via
  JWT authentication and role middleware.
- **Appointment scheduling:** Receptionists check in customers and register walk-ins
  alongside online bookings.
- **Barber schedule view:** Barbers can see their own upcoming appointments and schedule.
- **Session handling:** Barbers start and close service sessions tied to each appointment.
- **Billing:** Receptionists generate bills and mark them paid.
- **Service & pricing management:** Admins define service types and set prices.
- **Staff management:** Admins register new staff members.
- **Business reporting:** Admins get diagrammatic reports on sales, barber performance,
  and customer flow.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Auth:** JWT (authMiddleware), role-based access (roleMiddleware)
- **Database:** PostgreSQL
- **Architecture:** Route → Controller → Model per domain (Admin, Barber, Receptionist)
- **Deployment:** Vercel (frontend), Render (backend)

## API Overview
| Role | Sample Endpoints |
|---|---|
| Admin | `POST /admin/users`, `GET /admin/reports/income`, `GET /admin/reports/customer-flow` |
| Barber | `PUT /barber/appointments/:id/start`, `PUT /barber/appointments/:id/close` |
| Receptionist | `POST /receptionist/appointments/book`, `PUT /receptionist/bills/:id/pay` |

## Setup
```bash
npm install
npm start
```

## Environment Variables
```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
```
