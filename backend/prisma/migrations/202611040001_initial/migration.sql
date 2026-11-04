BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(60) NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [username] NVARCHAR(80) NOT NULL,
    [passwordHash] NVARCHAR(300) NOT NULL,
    [totpSecret] NVARCHAR(500),
    [totpEnabled] BIT NOT NULL CONSTRAINT [User_totpEnabled_df] DEFAULT 0,
    [lastTotpStep] BIGINT NOT NULL CONSTRAINT [User_lastTotpStep_df] DEFAULT -1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [name] NVARCHAR(20) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [userId] NVARCHAR(60) NOT NULL,
    [roleName] NVARCHAR(20) NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([userId],[roleName])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(200) NOT NULL,
    [data] NVARCHAR(max) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(30) NOT NULL,
    [name] NVARCHAR(80) NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Component] (
    [id] NVARCHAR(60) NOT NULL,
    [name] NVARCHAR(300) NOT NULL,
    [category] NVARCHAR(30) NOT NULL,
    [brand] NVARCHAR(300) NOT NULL,
    [model] NVARCHAR(300) NOT NULL,
    [description] NVARCHAR(2000) NOT NULL,
    [image] NVARCHAR(2000),
    [estimatedPrice] DECIMAL(18,2),
    [priceSource] NVARCHAR(300),
    [priceReferenceDate] NVARCHAR(10),
    [priceKind] NVARCHAR(20) NOT NULL,
    [currency] NVARCHAR(3) NOT NULL CONSTRAINT [Component_currency_df] DEFAULT 'COP',
    [active] BIT NOT NULL CONSTRAINT [Component_active_df] DEFAULT 1,
    [revision] INT NOT NULL CONSTRAINT [Component_revision_df] DEFAULT 1,
    CONSTRAINT [Component_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PcBuild] (
    [id] NVARCHAR(60) NOT NULL,
    [ownerId] NVARCHAR(60) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [mode] NVARCHAR(20) NOT NULL,
    [budget] DECIMAL(18,2) NOT NULL,
    [profile] NVARCHAR(30) NOT NULL,
    [total] DECIMAL(18,2) NOT NULL,
    [compatibility] NVARCHAR(max) NOT NULL,
    [warnings] NVARCHAR(max) NOT NULL,
    [visibility] NVARCHAR(20) NOT NULL CONSTRAINT [PcBuild_visibility_df] DEFAULT 'private',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PcBuild_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PcBuild_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BuildItem] (
    [buildId] NVARCHAR(60) NOT NULL,
    [componentId] NVARCHAR(60) NOT NULL,
    [category] NVARCHAR(30) NOT NULL,
    [priceSnapshot] DECIMAL(18,2),
    [componentSnapshot] NVARCHAR(max) NOT NULL,
    CONSTRAINT [BuildItem_pkey] PRIMARY KEY CLUSTERED ([buildId],[componentId]),
    CONSTRAINT [BuildItem_buildId_category_key] UNIQUE NONCLUSTERED ([buildId],[category])
);

-- CreateTable
CREATE TABLE [dbo].[CoolerSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [type] NVARCHAR(80),
    [sockets] NVARCHAR(2000),
    [heightMm] FLOAT(53),
    CONSTRAINT [CoolerSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[CaseSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [supportedFormFactors] NVARCHAR(2000),
    [maxGpuLengthMm] FLOAT(53),
    [maxCoolerHeightMm] FLOAT(53),
    CONSTRAINT [CaseSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[RamSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [memoryType] NVARCHAR(80),
    [capacityGB] FLOAT(53),
    [frequencyMHz] FLOAT(53),
    [modules] INT,
    CONSTRAINT [RamSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[CpuSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [socket] NVARCHAR(80),
    [cores] INT,
    [threads] INT,
    [frequencyGHz] FLOAT(53),
    [tdp] FLOAT(53),
    [generation] NVARCHAR(80),
    CONSTRAINT [CpuSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[StorageSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [type] NVARCHAR(80),
    [capacityGB] FLOAT(53),
    [interface] NVARCHAR(80),
    CONSTRAINT [StorageSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[MotherboardSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [socket] NVARCHAR(80),
    [chipset] NVARCHAR(80),
    [supportedGenerations] NVARCHAR(2000),
    [formFactor] NVARCHAR(80),
    [memoryType] NVARCHAR(80),
    [storageInterfaces] NVARCHAR(2000),
    CONSTRAINT [MotherboardSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[PsuSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [watts] FLOAT(53),
    [certification] NVARCHAR(80),
    CONSTRAINT [PsuSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateTable
CREATE TABLE [dbo].[GpuSpec] (
    [componentId] NVARCHAR(60) NOT NULL,
    [vramGB] FLOAT(53),
    [memoryType] NVARCHAR(80),
    [watts] FLOAT(53),
    [lengthMm] FLOAT(53),
    CONSTRAINT [GpuSpec_pkey] PRIMARY KEY CLUSTERED ([componentId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Session_expiresAt_idx] ON [dbo].[Session]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Component_category_active_idx] ON [dbo].[Component]([category], [active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PcBuild_ownerId_updatedAt_idx] ON [dbo].[PcBuild]([ownerId], [updatedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleName_fkey] FOREIGN KEY ([roleName]) REFERENCES [dbo].[Role]([name]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Component] ADD CONSTRAINT [Component_category_fkey] FOREIGN KEY ([category]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PcBuild] ADD CONSTRAINT [PcBuild_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BuildItem] ADD CONSTRAINT [BuildItem_buildId_fkey] FOREIGN KEY ([buildId]) REFERENCES [dbo].[PcBuild]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BuildItem] ADD CONSTRAINT [BuildItem_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CoolerSpec] ADD CONSTRAINT [CoolerSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CaseSpec] ADD CONSTRAINT [CaseSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RamSpec] ADD CONSTRAINT [RamSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CpuSpec] ADD CONSTRAINT [CpuSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StorageSpec] ADD CONSTRAINT [StorageSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MotherboardSpec] ADD CONSTRAINT [MotherboardSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PsuSpec] ADD CONSTRAINT [PsuSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GpuSpec] ADD CONSTRAINT [GpuSpec_componentId_fkey] FOREIGN KEY ([componentId]) REFERENCES [dbo].[Component]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
