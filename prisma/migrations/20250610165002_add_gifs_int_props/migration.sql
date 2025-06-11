/*
  Warnings:

  - Changed the type of `x` on the `Gif` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `y` on the `Gif` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Gif" DROP COLUMN "x",
ADD COLUMN     "x" INTEGER NOT NULL,
DROP COLUMN "y",
ADD COLUMN     "y" INTEGER NOT NULL;
