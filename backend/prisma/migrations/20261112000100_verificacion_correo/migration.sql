CREATE TABLE `VerificacionCorreo` (
    `token_hash` VARCHAR(64) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expira_en` DATETIME(3) NOT NULL,
    INDEX `VerificacionCorreo_email_creado_en_idx` (`email`, `creado_en`),
    INDEX `VerificacionCorreo_expira_en_idx` (`expira_en`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
