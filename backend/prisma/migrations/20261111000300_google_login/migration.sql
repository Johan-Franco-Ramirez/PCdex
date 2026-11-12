-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `google_sub` VARCHAR(255) NULL,
    MODIFY `password_hash` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_google_sub_key` ON `Usuario`(`google_sub`);
