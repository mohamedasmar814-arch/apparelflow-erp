# ApparelFlow ERP

ApparelFlow ERP is a garment production workflow management system developed as part of the Webtezza internship technical assessment.

The system focuses on the **Production Batch Verification and Sewing Queue Gate**. It provides a controlled workflow between Cutting, Verification, and Sewing departments and prevents incomplete production batches from entering the sewing process.

---

## Project Overview

In garment manufacturing, a cutting batch must contain the correct number of garment components before sewing can begin. Missing components can create incomplete garments, production delays, and material waste.

ApparelFlow ERP solves this problem by introducing a verification gate between the Cutting and Sewing stages.

The workflow is:

**Cutting Supervisor → Cutting Verifier → Sewing Supervisor**

A batch cannot enter the Sewing Queue until all required components have been verified and no component has a shortage.

---

## Core Features

### Cutting Supervisor

The Cutting Supervisor can:

- Create a new cutting batch.
- Select a predefined garment recipe.
- Enter the target batch quantity.
- Enter the Fabric Roll ID.
- Record actual fabric usage in yards.
- Automatically generate expected component quantities from the recipe BOM.
- View batch status and fabric wastage.
- View rejected batches and rejection reasons.
- Re-submit a batch after re-cutting.

### Cutting Verifier

The Cutting Verifier can:

- View batches waiting for verification.
- Enter the actual quantity of each garment component.
- Compare actual quantities against expected quantities.
- View automatic GREEN, YELLOW, and RED verification results.
- Approve eligible batches.
- Reject batches with a mandatory reason.
- View recently approved and rejected batches.

### Sewing Supervisor

The Sewing Supervisor can:

- View only approved `READY` production batches.
- View recipe and production information.
- View verification results.
- View the Cutting Verifier responsible for approval.
- View verification timestamps.
- Start Sewing Assembly.

After sewing assembly begins, the batch changes from `READY` to `SEWING` and is removed from the READY Sewing Queue.

---

## Verification Traffic-Light Rules

The verification system uses the following business rules:

| Condition | Status | Meaning |
|---|---|---|
| Actual Quantity = Expected Quantity | GREEN | Exact quantity |
| Actual Quantity > Expected Quantity | YELLOW | Excess quantity |
| Actual Quantity < Expected Quantity | RED | Component shortage |

GREEN and YELLOW components are eligible for final approval.

A RED component creates a **hard stop** and prevents batch approval.

Component verification itself does not automatically approve a batch. The Cutting Verifier must explicitly make the final approval decision.

---

## Gatekeeper Rule

The Production Batch Verification stage acts as the gatekeeper between Cutting and Sewing.

A batch can be approved only when:

1. Verification components exist.
2. Every component has been verified.
3. No component has `PENDING` status.
4. No component has `RED` status.
5. The Cutting Verifier explicitly approves the batch.

The approval restriction is enforced on the backend as well as represented in the user interface. Therefore, bypassing a disabled UI button cannot allow a RED batch into the Sewing Queue.

Approved batches receive the `READY` status.

Only `READY` batches are eligible for the Sewing Queue.

---

## Recipe BOMs

### REC-BL01 — Casual Blouse

Standard fabric usage:

`1.8 yards per piece`

Wastage cap:

`5%`

Components:

| Component | Quantity Per Garment |
|---|---:|
| Front Body Panel | 1 |
| Back Body Panel | 1 |
| Sleeves (Left & Right) | 2 |
| Collar & Stand | 1 |
| Sleeve Cuffs | 2 |

### REC-CT02 — Crop Top

Standard fabric usage:

`1.1 yards per piece`

Wastage cap:

`8%`

Components:

| Component | Quantity Per Garment |
|---|---:|
| Front Chest Panel | 1 |
| Back Support Panel | 1 |
| Neck Binding Strip | 1 |
| Hem Elastic Casing | 1 |
| Side Strap Accents | 2 |

Expected component quantity is calculated using:

```text
Expected Quantity = Target Batch Quantity × Component Multiplier
```

Example:

For 10 Casual Blouses:

```text
Sleeves (Left & Right) = 10 × 2 = 20
```

---

## Fabric Wastage Calculation

Expected fabric usage is calculated using:

```text
Expected Fabric = Standard Fabric Per Unit × Batch Quantity
```

Fabric wastage percentage is calculated using:

```text
Wastage % =
((Actual Fabric Used - Expected Fabric) / Expected Fabric) × 100
```

The system displays the calculated wastage together with the recipe wastage cap for production visibility.

---

## Role-Based Access Control

ApparelFlow ERP implements server-side Role-Based Access Control (RBAC).

Three roles are available:

| Role | Authorized Workflow |
|---|---|
| Cutting Supervisor | Cutting batch management |
| Cutting Verifier | Component verification and final batch decisions |
| Sewing Supervisor | Sewing Queue and assembly start |

Authorization checks are performed on the server. A user cannot gain access to another production workflow simply by navigating directly to its URL.

---

## Demo Credentials

The login page provides visible demo role selection.

All demo accounts use the following password:

```text
ApparelFlow123!
```

### Cutting Supervisor

```text
Email: cutting@apparelflow.com
Password: ApparelFlow123!
```

### Cutting Verifier

```text
Email: verification@apparelflow.com
Password: ApparelFlow123!
```

### Sewing Supervisor

```text
Email: sewing@apparelflow.com
Password: ApparelFlow123!
```

These credentials are intended for assessment/demo purposes only.

The **Demo Role Access** section on the login page can automatically fill the appropriate demo credentials. It does not bypass authentication. The user must still sign in, and server-side RBAC is applied according to the authenticated account's assigned role.

Public self-registration is intentionally not provided because ApparelFlow ERP represents an internal organizational system. In a production environment, employee accounts and roles would normally be provisioned by an authorized administrator.

---

## Authentication

Authentication uses:

- Database-backed user accounts.
- Password hashing with `bcryptjs`.
- JWT-based sessions using `jose`.
- HTTP-only session cookies.
- Server-side role authorization.

The application does not rely only on client-side role checks.

---

## Database

The project uses **PostgreSQL** as the persistent relational database and **Prisma ORM** for database access and migrations.

Main database entities include:

- `User`
- `Recipe`
- `RecipeComponent`
- `CuttingOrder`
- `VerificationItem`
- `VerificationLog`
- `BatchVerificationAudit`
- `BatchVerificationAuditItem`

### Relationship Overview

```text
User
 │
 ├── creates ──────────────> CuttingOrder
 │
 ├── verifies ─────────────> CuttingOrder
 │
 ├── VerificationLog
 │
 └── BatchVerificationAudit

Recipe
 │
 ├── RecipeComponent
 │
 └── CuttingOrder
        │
        ├── VerificationItem
        │      │
        │      └── VerificationLog
        │
        └── BatchVerificationAudit
                 │
                 └── BatchVerificationAuditItem
```

---

## Immutable Verification Audit

Final approval and rejection decisions create audit records.

A final audit stores information including:

- Production batch.
- Cutting Verifier.
- Approval or rejection decision.
- Rejection reason when applicable.
- Actual fabric usage.
- Expected standard fabric usage.
- Wastage percentage.
- Decision timestamp.

Each final audit also stores component snapshots containing:

- Component name.
- Expected quantity.
- Actual quantity.
- Verification status.

These snapshots preserve the component state at the time the final decision was made.

Normal workflow operations do not update these historical audit snapshots.

---

## Batch Status Workflow

The primary production flow is:

```text
CUTTING
   │
   ▼
PENDING_VERIFICATION
   │
   ├──── Reject ────> REJECTED
   │                     │
   │                     │ Re-cut and Resubmit
   │                     ▼
   │              PENDING_VERIFICATION
   │
   └──── Approve ──> READY
                         │
                         │ Start Sewing Assembly
                         ▼
                       SEWING
```

A rejected batch can be returned for re-cutting and then submitted for verification again.

---

## Sewing Queue Isolation

The Sewing Queue is protected by production status.

Only batches with:

```text
status = READY
```

are eligible for the READY Sewing Queue.

`PENDING_VERIFICATION`, `REJECTED`, `CUTTING`, and `SEWING` batches are excluded.

This ensures that unapproved or incomplete batches cannot enter the READY sewing workflow.

---

## Defensive Validation

The application performs server-side validation for critical production inputs, including:

- Valid database IDs.
- Positive batch quantities.
- Valid numeric fabric usage.
- Whole-number component quantities.
- Non-negative actual component quantities.
- Mandatory rejection reasons.
- Valid batch workflow state.
- User authentication.
- User role authorization.

Client-side validation is used for usability, but critical business rules are also enforced on the server.

---

## Automated Testing

The project uses **Vitest** for automated business-rule testing.

Run the automated tests using:

```bash
npm test
```

The automated test suite covers the required workflow scenarios:

1. Successful approval when components are GREEN/YELLOW.
2. Approval blocked when any component is RED.
3. Rejection prevented when no rejection reason is provided.
4. Unauthorized roles prevented from component verification.
5. Sewing Queue eligibility restricted to READY batches.

Additional tests verify:

- Equal quantity produces GREEN.
- Excess quantity produces YELLOW.
- Shortage produces RED.

Current test result:

```text
Test Files  1 passed
Tests       8 passed
```

The tested production-rule functions are used by the application's verification workflow.

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Backend

- Next.js Server Actions
- TypeScript
- Prisma ORM

### Database

- PostgreSQL
- Neon PostgreSQL for cloud production database hosting

### Authentication and Security

- bcryptjs
- jose
- HTTP-only cookies
- Server-side RBAC

### Testing

- Vitest

### Development and Deployment Tools

- Visual Studio Code
- Git
- GitHub
- npm
- Railway
- Neon

---

## Project Structure

```text
apparelflow-erp/
│
├── app/
│   ├── cutting/
│   ├── verification/
│   ├── sewing/
│   ├── login/
│   ├── logout/
│   ├── generated/
│   └── page.tsx
│
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── production-rules.ts
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│   └── production-rules.test.ts
│
├── AI_OPTIMIZATION_REPORT.md
├── package.json
└── README.md
```

---

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/mohamedasmar814-arch/apparelflow-erp.git
cd apparelflow-erp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SESSION_SECRET="replace-with-a-secure-secret"
```

Do not commit the `.env` file or production credentials to GitHub.

### 4. Generate the Prisma Client

```bash
npx prisma generate
```

The production build also generates the Prisma Client automatically before the Next.js build.

### 5. Apply database migrations

For development:

```bash
npx prisma migrate dev
```

For a production environment:

```bash
npx prisma migrate deploy
```

### 6. Seed demo data

```bash
npx prisma db seed
```

### 7. Start the development server

```bash
npm run dev
```

Open the application locally at:

```text
http://localhost:3000
```

The root route redirects to the ApparelFlow login page.

---

## Available Commands

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Generates the Prisma Client and creates an optimized Next.js production build.

```bash
npm start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint.

```bash
npm test
```

Runs the automated Vitest test suite.

---

## Production Build Verification

The application has been verified using:

```bash
npm run build
```

The production build performs:

```text
Prisma Client Generation
        ↓
Next.js Production Build
```

The production build successfully compiles the following application routes:

```text
/
/login
/cutting
/verification
/sewing
```

---

## Security Considerations

The application includes several controls designed to protect workflow integrity:

- Passwords are stored as hashes rather than plain text.
- Session cookies are HTTP-only.
- Production deployments use secure cookies.
- RBAC is enforced on server actions and protected pages.
- Critical numeric inputs are validated server-side.
- RED component shortages are blocked by backend approval logic.
- Final decisions are stored in audit records.
- Database state checks help prevent duplicate final decisions.
- Environment secrets are excluded from source control.
- Demo credentials are provided only for assessment and demonstration.
- Public self-registration is intentionally disabled for the internal ERP workflow.

---

## AI-Assisted Development

AI tools were used during development to support code review, debugging, business-rule validation, testing strategy, and documentation.

The use of AI and the optimization process are documented separately in:

```text
AI_OPTIMIZATION_REPORT.md
```

---

## Author

**Mohamed Asmar**

ApparelFlow ERP  
Webtezza Internship Technical Assessment

---

## Repository

GitHub repository:

```text
https://github.com/mohamedasmar814-arch/apparelflow-erp
```

---

## Deployment

ApparelFlow ERP is deployed as a live production application using **Railway** with a cloud-hosted **Neon PostgreSQL** database.

### Live Application

https://apparelflow-erp-production-605a.up.railway.app

### Production Deployment

The production deployment includes:

- Next.js production application hosted on Railway.
- Neon cloud-hosted PostgreSQL database.
- Prisma ORM for persistent relational database access.
- Production environment variables for database connectivity and session security.
- Server-side authentication.
- Role-Based Access Control (RBAC).
- Persistent Cutting, Verification, and Sewing workflow data.
- Automated Prisma Client generation during the cloud production build.

The live application can be tested using the demo accounts documented in the **Demo Credentials** section.

### Live Workflow

The deployed application supports the complete production workflow:

```text
Cutting Supervisor
        ↓
Production Batch Creation
        ↓
Cutting Verifier
        ↓
Component Verification
        ↓
GREEN / YELLOW / RED
        ↓
Final Approval or Rejection
        ↓
Approved READY Batch
        ↓
Sewing Supervisor
        ↓
Start Sewing Assembly
        ↓
SEWING
```

A component shortage produces a RED status and creates a hard stop that prevents approval.

Rejected batches can be returned to Cutting for re-cutting and resubmitted for verification.

Only batches explicitly approved by the Cutting Verifier receive `READY` status and become visible in the Sewing Queue.

After **Start Sewing Assembly** is selected, the batch changes from `READY` to `SEWING` and is removed from the READY Sewing Queue.
