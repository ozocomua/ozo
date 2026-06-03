-- AlterTable
ALTER TABLE `Category` ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` VARCHAR(191) NULL,
    ADD COLUMN `seoAlt` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` VARCHAR(191) NULL,
    ADD COLUMN `seoAlt` VARCHAR(191) NULL;
