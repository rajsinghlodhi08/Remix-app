/*
  Warnings:

  - Added the required column `price` to the `quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product` to the `quote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `quote` ADD COLUMN `price` VARCHAR(191) NOT NULL,
    ADD COLUMN `product` VARCHAR(191) NOT NULL;
