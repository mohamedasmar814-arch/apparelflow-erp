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

async function renameExistingComponent(
  recipeId: number,
  oldName: string,
  newName: string,
  requiredQty: number,
) {
  const oldComponent = await prisma.recipeComponent.findUnique({
    where: {
      recipeId_name: {
        recipeId,
        name: oldName,
      },
    },
  });

  const newComponent = await prisma.recipeComponent.findUnique({
    where: {
      recipeId_name: {
        recipeId,
        name: newName,
      },
    },
  });

  // Existing database:
  // Rename the old component in place so its ID and relationships survive.
  if (oldComponent && !newComponent) {
    await prisma.recipeComponent.update({
      where: {
        id: oldComponent.id,
      },
      data: {
        name: newName,
        requiredQty,
      },
    });

    return;
  }

  // Already corrected database:
  // Make sure the multiplier remains correct.
  if (newComponent) {
    await prisma.recipeComponent.update({
      where: {
        id: newComponent.id,
      },
      data: {
        requiredQty,
      },
    });

    return;
  }

  // Fresh database:
  // Create the correct component.
  await prisma.recipeComponent.create({
    data: {
      recipeId,
      name: newName,
      requiredQty,
    },
  });
}

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
      name: "Cutting Verifier",
      password: passwordHash,
      role: Role.VERIFICATION,
    },
    create: {
      name: "Cutting Verifier",
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
  // CASUAL BLOUSE — REC-BL01
  // Category: Blouse
  // Standard fabric: 1.8 yards per garment
  // Wastage cap: 5%
  // -------------------------------------------------------

  const casualBlouse = await prisma.recipe.upsert({
    where: {
      styleCode: "REC-BL01",
    },
    update: {
      styleName: "Casual Blouse",
      category: "Blouse",
      description: "Casual blouse production recipe",
      standardFabricPerUnit: 1.8,
      wastageCap: 5,
    },
    create: {
      styleCode: "REC-BL01",
      styleName: "Casual Blouse",
      category: "Blouse",
      description: "Casual blouse production recipe",
      standardFabricPerUnit: 1.8,
      wastageCap: 5,
    },
  });

  await renameExistingComponent(
    casualBlouse.id,
    "Front Panel",
    "Front Body Panel",
    1,
  );

  await renameExistingComponent(
    casualBlouse.id,
    "Back Panel",
    "Back Body Panel",
    1,
  );

  await renameExistingComponent(
    casualBlouse.id,
    "Sleeve",
    "Sleeves (Left & Right)",
    2,
  );

  await renameExistingComponent(
    casualBlouse.id,
    "Collar",
    "Collar & Stand",
    1,
  );

  await renameExistingComponent(
    casualBlouse.id,
    "Sleeve Cuffs",
    "Sleeve Cuffs",
    2,
  );

  // -------------------------------------------------------
  // CROP TOP — REC-CT02
  // Category: Crop Top
  // Standard fabric: 1.1 yards per garment
  // Wastage cap: 8%
  // -------------------------------------------------------

  const cropTop = await prisma.recipe.upsert({
    where: {
      styleCode: "REC-CT02",
    },
    update: {
      styleName: "Crop Top",
      category: "Crop Top",
      description: "Crop top production recipe",
      standardFabricPerUnit: 1.1,
      wastageCap: 8,
    },
    create: {
      styleCode: "REC-CT02",
      styleName: "Crop Top",
      category: "Crop Top",
      description: "Crop top production recipe",
      standardFabricPerUnit: 1.1,
      wastageCap: 8,
    },
  });

  await renameExistingComponent(
    cropTop.id,
    "Front Panel",
    "Front Chest Panel",
    1,
  );

  await renameExistingComponent(
    cropTop.id,
    "Back Panel",
    "Back Support Panel",
    1,
  );

  await renameExistingComponent(
    cropTop.id,
    "Neckline Binding",
    "Neck Binding Strip",
    1,
  );

  await renameExistingComponent(
    cropTop.id,
    "Waistband",
    "Hem Elastic Casing",
    1,
  );

  await renameExistingComponent(
    cropTop.id,
    "Sleeve",
    "Side Strap Accents",
    2,
  );

  console.log("ApparelFlow database seeded successfully.");
  console.log("");
  console.log("Recipes synchronized with the assessment specification.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Cutting Supervisor: cutting@apparelflow.com");
  console.log("Cutting Verifier: verification@apparelflow.com");
  console.log("Sewing Supervisor: sewing@apparelflow.com");
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