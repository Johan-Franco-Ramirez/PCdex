-- Añade únicamente la asociación estable de Google; no altera cuentas existentes.
CREATE TABLE `GoogleIdentity` (
  `googleSub` VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
  `userId` VARCHAR(60) NOT NULL,
  UNIQUE INDEX `GoogleIdentity_userId_key` (`userId`),
  PRIMARY KEY (`googleSub`),
  CONSTRAINT `GoogleIdentity_userId_fkey` FOREIGN KEY (`userId`)
    REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmailVerification` (
  `email` VARCHAR(254) NOT NULL,
  `codeHash` CHAR(64) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`email`),
  INDEX `EmailVerification_expiresAt_idx` (`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
