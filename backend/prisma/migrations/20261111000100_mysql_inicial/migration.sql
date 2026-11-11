-- CreateTable
CREATE TABLE `Componente` (
    `id` VARCHAR(100) NOT NULL,
    `nombre` VARCHAR(300) NOT NULL,
    `marca` VARCHAR(120) NOT NULL,
    `categoria` VARCHAR(40) NOT NULL,
    `precio` DECIMAL(18, 2) NULL,

    INDEX `Componente_categoria_precio_id_idx`(`categoria`, `precio`, `id`),
    INDEX `Componente_marca_idx`(`marca`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Procesador` (
    `componente_id` VARCHAR(100) NOT NULL,
    `socket` VARCHAR(60) NOT NULL,
    `nucleos` INTEGER NOT NULL,
    `tdp` INTEGER NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TarjetaGrafica` (
    `componente_id` VARCHAR(100) NOT NULL,
    `vram` DECIMAL(10, 2) NOT NULL,
    `tdp` INTEGER NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlacaMadre` (
    `componente_id` VARCHAR(100) NOT NULL,
    `socket` VARCHAR(60) NOT NULL,
    `tipo_ram` VARCHAR(40) NOT NULL,
    `formato` VARCHAR(60) NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemoriaRAM` (
    `componente_id` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `capacidad` INTEGER NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuentePoder` (
    `componente_id` VARCHAR(100) NOT NULL,
    `vatios` INTEGER NOT NULL,
    `certificacion` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Almacenamiento` (
    `componente_id` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(60) NOT NULL,
    `capacidad` INTEGER NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gabinete` (
    `componente_id` VARCHAR(100) NOT NULL,
    `formato` VARCHAR(60) NOT NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refrigeracion` (
    `componente_id` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(60) NOT NULL,
    `tdp_soportado` INTEGER NULL,

    PRIMARY KEY (`componente_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Procesador` ADD CONSTRAINT `Procesador_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TarjetaGrafica` ADD CONSTRAINT `TarjetaGrafica_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PlacaMadre` ADD CONSTRAINT `PlacaMadre_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `MemoriaRAM` ADD CONSTRAINT `MemoriaRAM_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `FuentePoder` ADD CONSTRAINT `FuentePoder_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Almacenamiento` ADD CONSTRAINT `Almacenamiento_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Gabinete` ADD CONSTRAINT `Gabinete_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Refrigeracion` ADD CONSTRAINT `Refrigeracion_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `Componente`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
