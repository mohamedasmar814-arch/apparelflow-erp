import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting ApparelFlow database seed...");

  // --------------------------------------------------
  // 1. Create demo users for each ApparelFlow role
  // --------------------------------------------------

  const passwordHash = await bcrypt.hash("ApparelFlow123!", 10);

  await prisma.user.upsert({
    where: { email: "cutting@apparelflow.com" },
    update: {},
    create: {
      name: "Cutting Supervisor",
      email: "cutting@apparelflow.com",
      password: passwordHash,
      role: Role.CUTTING,
    },
  });

  await prisma.user.upsert({
    where: { email: "verification@apparelflow.com" },
    update: {},
    create: {
      name: "Verification Officer",
      email: "verification@apparelflow.com",
      password: passwordHash,
      role: Role.VERIFICATION,
    },
  });

  await prisma.user.upsert({
    where: { email: "sewing@apparelflow.com" },
    update: {},
    create: {
      name: "Sewing Supervisor",
      email: "sewing@apparelflow.com",
      password: passwordHash,
      role: Role.SEWING,
    },
  });

  // --------------------------------------------------
  // 2. Create Casual Blouse recipe
  // --------------------------------------------------

  await prisma.recipe.upsert({
    where: { styleCode: "CB-001" },
    update: {},
    create: {
      styleCode: "CB-001",
      styleName: "Casual Blouse",
      description: "Standard casual blouse production recipe",
      components: {
        create: [
          {
            name: "Front Panel",
            requiredQty: 1,
          },
          {
            name: "Back Panel",
            requiredQty: 1,
          },
          {
            name: "Sleeve",
            requiredQty: 2,
          },
          {
            name: "Collar",
            requiredQty: 1,
          },
        ],
      },
    },
  });

  // --------------------------------------------------
  // 3. Create Crop Top recipe
  // --------------------------------------------------

  await prisma.recipe.upsert({
    where: { styleCode: "CT-001" },
    update: {},
    create: {
      styleCode: "CT-001",
      styleName: "Crop Top",
      description: "Standard crop top production recipe",
      components: {
        create: [
          {
            name: "Front Panel",
            requiredQty: 1,
          },
          {
            name: "Back Panel",
            requiredQty: 1,
          },
          {
            name: "Sleeve",
            requiredQty: 2,
          },
        ],
      },
    },
  });

  console.log("ApparelFlow database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });