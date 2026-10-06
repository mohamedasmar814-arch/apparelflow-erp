import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
} from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting ApparelFlow database seed...");

  // -------------------------------------------------------
  // DEMO USERS
  // -------------------------------------------------------

  const passwordHash = await bcrypt.hash("ApparelFlow123!", 10);

  await prisma.user.upsert({
    where: {
      email: "cutting@apparelflow.com",
    },
    update: {
      name: "Cutting Supervisor",
      password: passwordHash,
      role: Role.CUTTING,
    },
    create: {
      name: "Cutting Supervisor",
      email: "cutting@apparelflow.com",
      password: passwordHash,
      role: Role.CUTTING,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "verification@apparelflow.com",
    },
    update: {
      name: "Verification Officer",
      password: passwordHash,
      role: Role.VERIFICATION,
    },
    create: {
      name: "Verification Officer",
      email: "verification@apparelflow.com",
      password: passwordHash,
      role: Role.VERIFICATION,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "sewing@apparelflow.com",
    },
    update: {
      name: "Sewing Supervisor",
      password: passwordHash,
      role: Role.SEWING,
    },
    create: {
      name: "Sewing Supervisor",
      email: "sewing@apparelflow.com",
      password: passwordHash,
      role: Role.SEWING,
    },
  });

  // -------------------------------------------------------
  // CASUAL BLOUSE
  // REC-BL01
  // Standard fabric: 1.8 yards per garment
  // Wastage cap: 5%
  // -------------------------------------------------------

  const casualBlouse = await prisma.recipe.upsert({
    where: {
      styleCode: "REC-BL01",
    },
    update: {
      styleName: "Casual Blouse",
      description: "Casual blouse production recipe",
      standardFabricPerUnit: 1.8,
      wastageCap: 5,
    },
    create: {
      styleCode: "REC-BL01",
      styleName: "Casual Blouse",
      description: "Casual blouse production recipe",
      standardFabricPerUnit: 1.8,
      wastageCap: 5,
    },
  });

  const blouseComponents = [
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
    {
      name: "Sleeve Cuffs",
      requiredQty: 2,
    },
  ];

  for (const component of blouseComponents) {
    await prisma.recipeComponent.upsert({
      where: {
        recipeId_name: {
          recipeId: casualBlouse.id,
          name: component.name,
        },
      },
      update: {
        requiredQty: component.requiredQty,
      },
      create: {
        recipeId: casualBlouse.id,
        name: component.name,
        requiredQty: component.requiredQty,
      },
    });
  }

  // -------------------------------------------------------
  // CROP TOP
  // REC-CT02
  // Standard fabric: 1.1 yards per garment
  // Wastage cap: 8%
  // -------------------------------------------------------

  const cropTop = await prisma.recipe.upsert({
    where: {
      styleCode: "REC-CT02",
    },
    update: {
      styleName: "Crop Top",
      description: "Crop top production recipe",
      standardFabricPerUnit: 1.1,
      wastageCap: 8,
    },
    create: {
      styleCode: "REC-CT02",
      styleName: "Crop Top",
      description: "Crop top production recipe",
      standardFabricPerUnit: 1.1,
      wastageCap: 8,
    },
  });

  const cropTopComponents = [
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
      name: "Neckline Binding",
      requiredQty: 1,
    },
    {
      name: "Waistband",
      requiredQty: 1,
    },
  ];

  for (const component of cropTopComponents) {
    await prisma.recipeComponent.upsert({
      where: {
        recipeId_name: {
          recipeId: cropTop.id,
          name: component.name,
        },
      },
      update: {
        requiredQty: component.requiredQty,
      },
      create: {
        recipeId: cropTop.id,
        name: component.name,
        requiredQty: component.requiredQty,
      },
    });
  }

  console.log("ApparelFlow database seeded successfully.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Cutting: cutting@apparelflow.com");
  console.log("Verification: verification@apparelflow.com");
  console.log("Sewing: sewing@apparelflow.com");
  console.log("Password: ApparelFlow123!");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });