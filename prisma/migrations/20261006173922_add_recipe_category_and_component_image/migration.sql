-- Add recipe category as nullable first so existing recipe records are preserved
ALTER TABLE "Recipe"
ADD COLUMN "category" TEXT;

-- Add optional component image URL
ALTER TABLE "RecipeComponent"
ADD COLUMN "imageUrl" TEXT;