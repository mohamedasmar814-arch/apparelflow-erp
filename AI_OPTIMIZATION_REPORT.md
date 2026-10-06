# AI Optimization Report — ApparelFlow ERP

## Introduction

ApparelFlow ERP was developed for the Webtezza internship technical assessment, focusing on the **Production Batch Verification and Sewing Queue Gate**.

AI-assisted development was used throughout the project to support requirement interpretation, architecture planning, debugging, code review, testing, database design, security review, and documentation.

AI-generated suggestions were not treated as automatically correct. Suggestions were reviewed against the assessment specification and then validated through code review, automated testing, manual workflow testing, database inspection, and production builds.

This report documents four key areas of AI-assisted development:

1. Tools & Prompting
2. Flawed/Broken AI Code Instances
3. Human Refactoring
4. Defensive Architecture

---

# 1. Tools & Prompting

## 1.1 AI Tool Used

ChatGPT was used as an AI-assisted software development tool during the implementation of ApparelFlow ERP.

The development environment and supporting technologies included:

- Visual Studio Code
- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Neon PostgreSQL
- Railway
- Git
- GitHub
- Vitest
- npm

AI assistance was used as a development support mechanism rather than as an autonomous replacement for developer decision-making.

---

## 1.2 Requirement Analysis Prompts

One of the first uses of AI was breaking the assessment specification into technical requirements.

The assessment was interpreted into the following core workflow:

```text
Cutting Supervisor
        ↓
Create Cutting Batch
        ↓
PENDING_VERIFICATION
        ↓
Cutting Verifier
        ↓
Component Count QC
        ↓
GREEN / YELLOW / RED
        ↓
Approve or Reject
        ↓
READY
        ↓
Sewing Supervisor
        ↓
Start Sewing Assembly
        ↓
SEWING
```

Example prompt intention:

```text
Review the ApparelFlow assessment requirements and identify the
database entities, user roles, production states, verification rules,
security controls, and hard-stop conditions required by the system.
```

This helped translate the business requirements into implementation tasks.

---

## 1.3 Database Design Prompts

AI assistance was used to review the relational database structure required to support the production workflow.

Example prompt intention:

```text
Design a relational Prisma schema for ApparelFlow ERP that supports
users, garment recipes, recipe components, cutting batches,
component verification, immutable verification audits, and the
Sewing Queue.
```

The final database design contains entities including:

- `User`
- `Recipe`
- `RecipeComponent`
- `CuttingOrder`
- `VerificationItem`
- `VerificationLog`
- `BatchVerificationAudit`
- `BatchVerificationAuditItem`

The database design was reviewed manually before migrations were applied.

---

## 1.4 Verification Logic Prompts

AI was used to reason about the required component verification rules.

The required traffic-light rules are:

```text
Actual Quantity = Expected Quantity → GREEN
Actual Quantity > Expected Quantity → YELLOW
Actual Quantity < Expected Quantity → RED
```

Expected component quantities are calculated using:

```text
Expected Quantity =
Target Batch Quantity × Component Multiplier
```

Example prompt intention:

```text
Create reusable TypeScript business-rule functions for component
verification where equal quantities are GREEN, excess quantities are
YELLOW, shortages are RED, and any RED component prevents approval.
```

The resulting logic was separated into reusable production-rule functions so that the same business rules could be tested independently.

---

## 1.5 Authentication and RBAC Prompts

AI assistance was used to review authentication and authorization requirements.

Example prompt intention:

```text
Implement secure role-based access control for Cutting Supervisor,
Cutting Verifier, and Sewing Supervisor. Critical authorization
must be enforced on the server rather than only through hidden UI
elements.
```

The application ultimately uses:

- Database-backed user accounts
- bcrypt password hashing
- JWT-based sessions
- HTTP-only cookies
- Server-side role validation
- Protected workflow actions

---

## 1.6 Testing Prompts

AI assistance was used to identify important automated test scenarios.

Example prompt intention:

```text
Create automated tests for the ApparelFlow verification rules,
including successful approval eligibility, RED shortage blocking,
mandatory rejection reasons, unauthorized verification attempts,
and Sewing Queue isolation.
```

Vitest was used for the automated test suite.

The final suite contains eight automated tests.

---

## 1.7 Documentation and Deployment Prompts

AI was also used to review:

- README documentation
- Environment configuration
- Prisma Client generation
- Railway deployment
- Neon database configuration
- Production build errors
- Git commit organization
- AI-assisted development documentation

All generated recommendations were reviewed before being applied.

---

# 2. Flawed/Broken AI Code Instances

AI-generated or AI-assisted solutions were not always correct on the first attempt. Several issues required human review and correction.

The following examples demonstrate why AI output was not accepted without validation.

---

## 2.1 Flawed AI Instance 1 — Prisma Schema Formatting

### Problem

During development, an AI-assisted Prisma schema modification contained relation formatting that was not accepted correctly by the Prisma parser.

The proposed structure looked logically reasonable but failed Prisma validation.

This demonstrated that syntactically plausible AI-generated code is not necessarily valid for the exact installed framework version.

### Detection

The problem was identified when Prisma validation/migration commands rejected the schema.

The schema was then reviewed manually rather than forcing the migration.

### Human Correction

The Prisma relation definitions were corrected according to the actual project schema and Prisma version.

After the correction, the schema was validated again before database migrations were applied.

### Lesson

AI-generated ORM code must be checked using the ORM's own validation tools before being allowed to modify a persistent database.

---

## 2.2 Flawed AI Instance 2 — Authentication Navigation

### Problem

An earlier login implementation successfully authenticated the user but did not always navigate reliably to the role-specific dashboard.

The browser could remain visually stuck in a signing-in state even though authentication had succeeded.

### Detection

This issue was discovered through manual browser testing rather than compilation.

The code could compile successfully while still producing incorrect runtime behaviour.

### Human Correction

The login navigation strategy was changed to perform a full browser navigation after successful authentication.

The authentication flow was then manually tested with:

- Cutting Supervisor
- Cutting Verifier
- Sewing Supervisor

Server-side session validation remained responsible for determining authorized access.

### Lesson

Successful compilation does not prove that an authentication workflow behaves correctly in the browser.

Runtime testing was necessary.

---

## 2.3 Flawed AI Instance 3 — Incomplete Audit Design

### Problem

An earlier audit design focused mainly on batch-level information.

It recorded information such as:

- Verifier
- Decision
- Timestamp
- Fabric usage
- Wastage

However, this was insufficient for preserving the exact component state at the moment of final approval or rejection.

If component information changed later, relying only on current verification records would weaken the historical audit trail.

### Human Correction

A dedicated component-level immutable snapshot model was added:

```text
BatchVerificationAuditItem
```

Each final audit can therefore preserve:

- Component name
- Expected quantity
- Actual quantity
- Verification status

This means the historical verification decision does not depend entirely on mutable current-state records.

### Lesson

AI-generated database designs must be evaluated against business audit requirements, not simply against whether the database can store data.

---

## 2.4 Flawed AI Instance 4 — Dependency Compatibility

### Problem

During automated testing setup, a newer Vitest dependency recommendation created compatibility problems with the project's existing dependency environment.

Forcing installation could have destabilized the application.

### Human Correction

Instead of forcing incompatible dependencies, a compatible Vitest version was selected.

The final project uses:

```text
Vitest 3.2.4
```

The automated tests then ran successfully.

### Lesson

AI-generated dependency recommendations should never be installed blindly.

The existing Node.js, TypeScript, framework, and package versions must be considered.

---

## 2.5 Flawed AI Instance 5 — Recipe BOM Naming

### Problem

An earlier implementation used component names that did not exactly match the final assessment specification.

For example, earlier names included:

```text
Front Panel
Back Panel
Sleeve
Collar
```

The assessment required more specific Casual Blouse component names:

```text
Front Body Panel
Back Body Panel
Sleeves (Left & Right)
Collar & Stand
Sleeve Cuffs
```

The Crop Top recipe also required:

```text
Front Chest Panel
Back Support Panel
Neck Binding Strip
Hem Elastic Casing
Side Strap Accents
```

### Human Correction

The original assessment specification was reviewed again.

The seed logic and project documentation were corrected to use the required component names.

Instead of deleting and recreating existing production components, the existing component records were renamed while preserving their database IDs.

This protected existing relational references from `VerificationItem` records.

The production Neon database was also updated and queried afterward to confirm that exactly ten required recipe component records existed.

### Lesson

AI interpretation of requirements must always be checked against the authoritative specification.

A solution can be technically functional while still being incorrect from a business-requirement perspective.

---

# 3. Human Refactoring

Human review was used throughout the project to convert AI-assisted suggestions into a safer and more maintainable implementation.

---

## 3.1 Separating Business Rules

Verification logic was extracted into reusable functions rather than duplicating conditions throughout UI components.

The production rules include functions for:

- Traffic-light classification
- Approval eligibility
- Rejection reason validation
- Verification role authorization
- Sewing Queue eligibility

This improved maintainability and made automated testing easier.

---

## 3.2 Strengthening the Approval Gate

A major refactoring decision was ensuring that the verification gate did not exist only in the user interface.

The UI disables approval when a RED or PENDING component exists.

However, the server independently checks the same condition.

The effective rule is:

```text
IF
    verification items exist
AND every item has been counted
AND no item is PENDING
AND no item is RED
THEN
    approval may continue
ELSE
    approval is rejected
```

This protects the workflow even if a user attempts to bypass the browser interface.

---

## 3.3 Separating Component Verification from Final Approval

A component becoming GREEN or YELLOW does not automatically release the batch to Sewing.

The application requires an explicit final approval decision by the authorized verifier.

This distinction was retained because component counting and final batch authorization are separate business events.

---

## 3.4 Improving the Audit Model

The audit system was refactored from simple batch-level information into a more complete historical record.

The final audit stores:

- Production batch
- Verifier identity
- Decision
- Decision timestamp
- Rejection reason when applicable
- Actual fabric usage
- Expected fabric usage
- Wastage percentage

Component snapshots additionally store:

- Component name
- Expected quantity
- Actual quantity
- Verification status

These snapshots are not modified by normal later workflow operations.

---

## 3.5 Transaction-Based Finalization

Approval and rejection operations were structured using database transactions.

Conceptually:

```text
BEGIN TRANSACTION

Validate current batch state
Validate authorization
Validate component state

Update batch decision

Create audit record
Create component audit snapshots

COMMIT
```

This prevents a partial finalization where the production status changes but the corresponding audit record is not stored.

---

## 3.6 Safe Recipe Correction

When the recipe component names were corrected, existing component records were not simply deleted.

Deleting them could have damaged relationships with existing verification data.

Instead, the existing records were updated in place while preserving their IDs.

This approach maintained referential integrity while aligning the system with the official BOM specification.

---

## 3.7 Authentication Refactoring

Authentication was implemented using database-backed accounts rather than a purely visual role switcher.

The visible demo role selection assists the evaluator by filling appropriate credentials, but it does not bypass authentication.

The final authentication flow uses:

```text
User Credentials
      ↓
Database User Validation
      ↓
bcrypt Password Verification
      ↓
JWT Session
      ↓
HTTP-only Cookie
      ↓
Server-Side Role Validation
```

---

## 3.8 Sewing Queue Refactoring

The Sewing Queue was designed around database state rather than a client-side list.

The eligibility condition is:

```text
status = READY
```

Therefore:

```text
CUTTING              → Not eligible
PENDING_VERIFICATION → Not eligible
REJECTED             → Not eligible
READY                → Eligible
SEWING               → Not in READY queue
```

This prevents an unapproved batch from appearing in the READY Sewing Queue.

---

# 4. Defensive Architecture

Defensive architecture was used because the application controls a production handoff between departments.

Important rules therefore cannot depend only on client-side behaviour.

---

## 4.1 Server-Side RBAC

The application implements server-side authorization.

The three workflow roles are:

```text
CUTTING
VERIFICATION
SEWING
```

These correspond to:

```text
Cutting Supervisor
Cutting Verifier
Sewing Supervisor
```

Authorization responsibilities are separated:

| Role | Responsibility |
|---|---|
| Cutting Supervisor | Create and re-submit cutting batches |
| Cutting Verifier | Verify components and make final decisions |
| Sewing Supervisor | View released batches and start sewing |

Direct navigation to another role's page does not grant permission to perform that role's protected actions.

---

## 4.2 RED Hard Stop

The most important defensive production rule is the RED hard stop.

```text
Actual < Expected → RED
```

If any component is RED:

```text
Approve Batch = BLOCKED
```

This is enforced both visually and on the server.

Therefore, manipulating a disabled browser button cannot legitimately release a shortage batch into the Sewing Queue.

---

## 4.3 PENDING Hard Stop

An uncounted component is represented as PENDING.

A batch containing PENDING verification items cannot be approved.

This prevents incomplete count checks from being treated as completed verification.

---

## 4.4 Mandatory Rejection Reason

Rejecting a production batch requires a reason.

An empty or whitespace-only rejection reason is rejected by validation.

The reason is preserved with the workflow/audit information so that Cutting personnel can understand why re-cutting is required.

---

## 4.5 Defensive Numeric Validation

Critical production inputs are validated.

Examples include:

- Database IDs must be valid.
- Target quantity must be positive.
- Fabric usage must be numeric.
- Component quantities must be whole numbers.
- Component quantities cannot be negative.
- Required fields cannot be empty.
- Workflow transitions must occur from valid states.

Client-side validation improves usability, but server-side validation remains authoritative.

---

## 4.6 Sewing Queue Isolation

Only explicitly approved `READY` batches are queried for the READY Sewing Queue.

This means a batch cannot reach Sewing simply because it exists in the database.

The production state itself acts as the release gate.

After **Start Sewing Assembly**, the state changes:

```text
READY → SEWING
```

The batch therefore disappears from the READY queue.

---

## 4.7 Immutable Verification Audit

A final approval or rejection creates a server-side audit record.

The verifier identity and timestamp are derived from the authenticated server-side workflow rather than being trusted as arbitrary client input.

The component state is also copied into audit snapshot records.

This provides historical evidence of the information used when the final decision was made.

---

## 4.8 Database Transaction Safety

Critical finalization operations use transactions so related database changes succeed or fail together.

This reduces the risk of inconsistent states such as:

```text
Batch = READY
Audit = Missing
```

or:

```text
Batch = REJECTED
Decision record = Missing
```

---

## 4.9 Persistent Relational Database

The application uses PostgreSQL rather than browser-only or temporary state.

Prisma ORM manages relational database access and migrations.

The production application uses a Neon-hosted PostgreSQL database.

This allows workflow state to survive:

- Browser refreshes
- User logout/login
- Application redeployment
- Movement between production roles

---

# 5. Official Recipe Verification

The final recipes were aligned with the assessment specification.

## REC-BL01 — Casual Blouse

Standard fabric:

```text
1.8 yards per piece
```

Wastage cap:

```text
5%
```

| Component | Multiplier |
|---|---:|
| Front Body Panel | 1 |
| Back Body Panel | 1 |
| Sleeves (Left & Right) | 2 |
| Collar & Stand | 1 |
| Sleeve Cuffs | 2 |

For a batch quantity of 10:

```text
Front Body Panel       = 10
Back Body Panel        = 10
Sleeves (Left & Right) = 20
Collar & Stand         = 10
Sleeve Cuffs           = 20
```

---

## REC-CT02 — Crop Top

Standard fabric:

```text
1.1 yards per piece
```

Wastage cap:

```text
8%
```

| Component | Multiplier |
|---|---:|
| Front Chest Panel | 1 |
| Back Support Panel | 1 |
| Neck Binding Strip | 1 |
| Hem Elastic Casing | 1 |
| Side Strap Accents | 2 |

For a batch quantity of 10:

```text
Front Chest Panel   = 10
Back Support Panel  = 10
Neck Binding Strip  = 10
Hem Elastic Casing  = 10
Side Strap Accents  = 20
```

---

# 6. Fabric Wastage Logic

Expected fabric usage is calculated using:

```text
Expected Fabric =
Standard Fabric Per Unit × Batch Quantity
```

Fabric wastage percentage is calculated using:

```text
Wastage % =
((Actual Fabric Used - Expected Fabric)
 / Expected Fabric) × 100
```

Example for 10 Casual Blouses:

```text
Standard Fabric Per Unit = 1.8 yards
Batch Quantity = 10

Expected Fabric = 1.8 × 10
                = 18.0 yards
```

If actual fabric usage is 18.5 yards:

```text
Wastage =
((18.5 - 18.0) / 18.0) × 100

= 2.78%
```

The recipe wastage cap is displayed with the calculated result.

---

# 7. Automated Testing

Vitest was used for automated business-rule testing.

The test suite contains eight tests.

The core scenarios include:

1. Successful approval eligibility when components contain no shortage.
2. RED component blocks approval.
3. Rejection without a reason is invalid.
4. Unauthorized roles cannot verify components.
5. Sewing Queue eligibility is restricted to READY batches.

Additional traffic-light tests verify:

6. Equal quantity produces GREEN.
7. Excess quantity produces YELLOW.
8. Shortage produces RED.

The test command is:

```bash
npm test
```

The final verified result was:

```text
Test Files  1 passed
Tests       8 passed
```

The reusable business rules tested by Vitest are also used by the application's production workflow.

---

# 8. Manual End-to-End Validation

Automated testing was combined with manual workflow testing.

Manual validation included:

- Logging in as the Cutting Supervisor.
- Creating a production batch.
- Checking expected BOM quantities.
- Logging in as the Cutting Verifier.
- Entering GREEN quantities.
- Entering YELLOW excess quantities.
- Creating a RED shortage.
- Confirming RED prevents approval.
- Attempting rejection without a reason.
- Rejecting with a valid reason.
- Returning the rejected batch to Cutting.
- Re-cutting and re-submitting the batch.
- Re-verifying component quantities.
- Approving an eligible batch.
- Confirming the approved batch enters the Sewing Queue.
- Logging in as the Sewing Supervisor.
- Starting Sewing Assembly.
- Confirming the batch leaves the READY Sewing Queue.
- Refreshing pages to confirm database persistence.
- Inspecting production database records.

This end-to-end testing validated the workflow beyond isolated unit tests.

---

# 9. Production Database Validation

The production application uses Neon PostgreSQL.

The production database was queried directly to verify the final recipe BOM records.

The final production data contains five components for each recipe and therefore ten recipe component records in total.

The production BOM was corrected using updates that preserved existing component IDs rather than deleting relational records.

This was important because existing verification items referenced those component IDs.

After the update, the production database was queried again to confirm the corrected component names and quantities.

---

# 10. Production Build and Deployment Validation

The application was repeatedly validated using:

```bash
npm run build
```

The production build generates the Prisma Client and then performs the Next.js production build.

The final application successfully completed the production build.

The application was deployed using Railway.

The persistent production PostgreSQL database is hosted using Neon.

The deployment workflow is:

```text
GitHub main branch
        ↓
Railway automatic deployment
        ↓
Next.js production build
        ↓
Railway application
        ↓
Neon PostgreSQL database
```

The final BOM alignment commit was successfully deployed and became the active Railway deployment.

---

# 11. Git and Iterative Development

Git and GitHub were used throughout development rather than uploading only a single final snapshot.

Changes were separated into iterative commits covering areas such as:

- Initial project setup
- Database and Prisma implementation
- Authentication and RBAC
- Cutting/Verification/Sewing workflow
- Workflow completion
- Cloud database configuration
- Production Prisma Client generation
- Live deployment documentation
- Final assessment BOM alignment

This commit history provides evidence of iterative development and correction.

---

# 12. Benefits of AI Assistance

AI assistance provided several benefits during development:

- Faster requirement interpretation.
- Faster architecture planning.
- Assistance with Prisma modeling.
- Debugging support.
- Identification of missing business rules.
- Suggestions for server-side validation.
- Assistance with automated testing.
- Documentation review.
- Deployment troubleshooting.
- Security and RBAC review.

AI was particularly useful for reviewing the interaction between Cutting, Verification, and Sewing workflows.

---

# 13. Limitations of AI Assistance

The development process also demonstrated important limitations.

AI-generated output can:

- Misinterpret assessment requirements.
- Produce framework-incompatible code.
- Suggest incorrect dependency versions.
- Generate code that compiles but behaves incorrectly.
- Miss important audit requirements.
- Duplicate existing logic.
- Suggest unnecessary complexity.
- Use inaccurate domain terminology.
- Produce technically valid solutions that do not exactly match business requirements.

For these reasons, AI output was treated as a draft or recommendation that required developer verification.

---

# 14. Human Validation Process

AI-assisted changes were validated through the following process:

```text
Official Assessment Specification
              ↓
      AI-Assisted Proposal
              ↓
         Human Review
              ↓
        Code Inspection
              ↓
 Prisma Validation / Migration
              ↓
    Automated Test Execution
              ↓
    Manual Browser Testing
              ↓
      Database Inspection
              ↓
     Production Build Test
              ↓
      Cloud Deployment
              ↓
     Live Workflow Check
```

A suggestion was not considered complete merely because it compiled.

The final behaviour had to satisfy the business requirement.

---

# 15. Final Optimization Result

The final ApparelFlow ERP implementation includes:

- Persistent PostgreSQL storage.
- Prisma relational database management.
- Real authentication.
- Server-side RBAC.
- Cutting Supervisor workflow.
- Cutting Verifier workflow.
- Sewing Supervisor workflow.
- Assessment-aligned recipe BOM calculations.
- GREEN/YELLOW/RED verification.
- Explicit final approval.
- Backend RED hard stop.
- PENDING hard stop.
- Mandatory rejection reasons.
- Re-cut and re-submission workflow.
- Fabric wastage calculation.
- Final verification audit records.
- Component-level audit snapshots.
- Database-controlled Sewing Queue eligibility.
- Sewing assembly state transition.
- Defensive input validation.
- Visible demo role access.
- Automated testing.
- Manual workflow testing.
- Production build verification.
- GitHub version control.
- Railway cloud deployment.
- Neon production database.

---

# Conclusion

AI-assisted development was valuable during the implementation of ApparelFlow ERP, particularly for requirement interpretation, architecture planning, debugging, code review, testing, documentation, and deployment troubleshooting.

However, the project also demonstrated why AI-generated output must not be accepted automatically.

Several AI-assisted solutions required correction, including Prisma schema formatting, authentication navigation, audit completeness, dependency compatibility, and exact recipe BOM terminology.

Human review and refactoring were therefore essential.

The most important production controls — including server-side RBAC, the RED shortage hard stop, PENDING verification protection, mandatory rejection reasons, immutable audit records, and Sewing Queue isolation — were validated through multiple layers of testing.

The final development approach combined AI assistance with human decision-making, automated testing, manual end-to-end testing, database inspection, production compilation, and live deployment validation.

This produced a more reliable implementation while also demonstrating responsible and critical use of AI during software development.