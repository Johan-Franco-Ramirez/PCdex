-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(60) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `username` VARCHAR(80) NOT NULL,
    `passwordHash` VARCHAR(300) NOT NULL,
    `totpSecret` VARCHAR(500) NULL,
    `totpEnabled` BOOLEAN NOT NULL DEFAULT false,
    `lastTotpStep` BIGINT NOT NULL DEFAULT -1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `name` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `userId` VARCHAR(60) NOT NULL,
    `roleName` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`userId`, `roleName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(200) NOT NULL,
    `data` LONGTEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Component` (
    `id` VARCHAR(60) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `brand` VARCHAR(300) NOT NULL,
    `model` VARCHAR(300) NOT NULL,
    `description` VARCHAR(2000) NOT NULL,
    `image` VARCHAR(2000) NULL,
    `estimatedPrice` DECIMAL(18, 2) NULL,
    `priceSource` VARCHAR(300) NULL,
    `priceReferenceDate` VARCHAR(10) NULL,
    `priceKind` VARCHAR(20) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'COP',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `revision` INTEGER NOT NULL DEFAULT 1,

    INDEX `Component_category_active_idx`(`category`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PcBuild` (
    `id` VARCHAR(60) NOT NULL,
    `ownerId` VARCHAR(60) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `mode` VARCHAR(20) NOT NULL,
    `budget` DECIMAL(18, 2) NOT NULL,
    `profile` VARCHAR(30) NOT NULL,
    `total` DECIMAL(18, 2) NOT NULL,
    `compatibility` LONGTEXT NOT NULL,
    `warnings` LONGTEXT NOT NULL,
    `visibility` VARCHAR(20) NOT NULL DEFAULT 'private',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PcBuild_ownerId_updatedAt_idx`(`ownerId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuildItem` (
    `buildId` VARCHAR(60) NOT NULL,
    `componentId` VARCHAR(60) NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `priceSnapshot` DECIMAL(18, 2) NULL,
    `componentSnapshot` LONGTEXT NOT NULL,

    UNIQUE INDEX `BuildItem_buildId_category_key`(`buildId`, `category`),
    PRIMARY KEY (`buildId`, `componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoolerSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `type` VARCHAR(80) NULL,
    `sockets` VARCHAR(2000) NULL,
    `heightMm` DOUBLE NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `supportedFormFactors` VARCHAR(2000) NULL,
    `maxGpuLengthMm` DOUBLE NULL,
    `maxCoolerHeightMm` DOUBLE NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RamSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `memoryType` VARCHAR(80) NULL,
    `capacityGB` DOUBLE NULL,
    `frequencyMHz` DOUBLE NULL,
    `modules` INTEGER NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CpuSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `socket` VARCHAR(80) NULL,
    `cores` INTEGER NULL,
    `threads` INTEGER NULL,
    `frequencyGHz` DOUBLE NULL,
    `tdp` DOUBLE NULL,
    `generation` VARCHAR(80) NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `type` VARCHAR(80) NULL,
    `capacityGB` DOUBLE NULL,
    `interface` VARCHAR(80) NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MotherboardSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `socket` VARCHAR(80) NULL,
    `chipset` VARCHAR(80) NULL,
    `supportedGenerations` VARCHAR(2000) NULL,
    `formFactor` VARCHAR(80) NULL,
    `memoryType` VARCHAR(80) NULL,
    `storageInterfaces` VARCHAR(2000) NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PsuSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `watts` DOUBLE NULL,
    `certification` VARCHAR(80) NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GpuSpec` (
    `componentId` VARCHAR(60) NOT NULL,
    `vramGB` DOUBLE NULL,
    `memoryType` VARCHAR(80) NULL,
    `watts` DOUBLE NULL,
    `lengthMm` DOUBLE NULL,

    PRIMARY KEY (`componentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleName_fkey` FOREIGN KEY (`roleName`) REFERENCES `Role`(`name`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Component` ADD CONSTRAINT `Component_category_fkey` FOREIGN KEY (`category`) REFERENCES `Category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PcBuild` ADD CONSTRAINT `PcBuild_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `BuildItem` ADD CONSTRAINT `BuildItem_buildId_fkey` FOREIGN KEY (`buildId`) REFERENCES `PcBuild`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `BuildItem` ADD CONSTRAINT `BuildItem_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `CoolerSpec` ADD CONSTRAINT `CoolerSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `CaseSpec` ADD CONSTRAINT `CaseSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `RamSpec` ADD CONSTRAINT `RamSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `CpuSpec` ADD CONSTRAINT `CpuSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `StorageSpec` ADD CONSTRAINT `StorageSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `MotherboardSpec` ADD CONSTRAINT `MotherboardSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PsuSpec` ADD CONSTRAINT `PsuSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `GpuSpec` ADD CONSTRAINT `GpuSpec_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
