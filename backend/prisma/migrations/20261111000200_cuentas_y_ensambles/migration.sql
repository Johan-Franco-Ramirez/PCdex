-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `rol` ENUM('USUARIO', 'ADMIN') NOT NULL DEFAULT 'USUARIO',
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sesion` (
    `id` VARCHAR(30) NOT NULL,
    `usuario_id` VARCHAR(30) NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expira_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sesion_token_hash_key`(`token_hash`),
    INDEX `Sesion_usuario_id_idx`(`usuario_id`),
    INDEX `Sesion_expira_en_idx`(`expira_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorito` (
    `usuario_id` VARCHAR(30) NOT NULL,
    `componente_id` VARCHAR(100) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorito_componente_id_idx`(`componente_id`),
    PRIMARY KEY (`usuario_id`, `componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ensamble` (
    `id` VARCHAR(30) NOT NULL,
    `usuario_id` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `presupuesto` DECIMAL(18, 2) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    INDEX `Ensamble_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PiezaEnsamble` (
    `ensamble_id` VARCHAR(30) NOT NULL,
    `componente_id` VARCHAR(100) NOT NULL,

    INDEX `PiezaEnsamble_componente_id_idx`(`componente_id`),
    PRIMARY KEY (`ensamble_id`, `componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sesion` ADD CONSTRAINT `Sesion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ensamble` ADD CONSTRAINT `Ensamble_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PiezaEnsamble` ADD CONSTRAINT `PiezaEnsamble_ensamble_id_fkey` FOREIGN KEY (`ensamble_id`) REFERENCES `Ensamble`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PiezaEnsamble` ADD CONSTRAINT `PiezaEnsamble_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
