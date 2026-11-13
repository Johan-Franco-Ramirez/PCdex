-- CreateTable
CREATE TABLE `VerificacionGoogle` (
    `token_hash` VARCHAR(64) NOT NULL,
    `sesion_id` VARCHAR(30) NOT NULL,
    `expira_en` DATETIME(3) NOT NULL,

    INDEX `VerificacionGoogle_sesion_id_idx`(`sesion_id`),
    INDEX `VerificacionGoogle_expira_en_idx`(`expira_en`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VerificacionGoogle` ADD CONSTRAINT `VerificacionGoogle_sesion_id_fkey` FOREIGN KEY (`sesion_id`) REFERENCES `Sesion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
