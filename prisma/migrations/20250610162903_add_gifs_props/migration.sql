/*
  Warnings:

  - Added the required column `alt` to the `Gif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Gif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Gif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x` to the `Gif` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `Gif` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gif" ADD COLUMN     "alt" TEXT NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL,
ADD COLUMN     "x" TEXT NOT NULL,
ADD COLUMN     "y" TEXT NOT NULL;
