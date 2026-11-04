BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Componente] (
    [id] NVARCHAR(100) NOT NULL,
    [nombre] NVARCHAR(300) NOT NULL,
    [marca] NVARCHAR(120) NOT NULL,
    [categoria] NVARCHAR(40) NOT NULL,
    [precio] DECIMAL(18,2),
    CONSTRAINT [Componente_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Procesador] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [socket] NVARCHAR(60) NOT NULL,
    [nucleos] INT NOT NULL,
    [tdp] INT NOT NULL,
    CONSTRAINT [Procesador_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[TarjetaGrafica] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [vram] DECIMAL(10,2) NOT NULL,
    [tdp] INT NOT NULL,
    CONSTRAINT [TarjetaGrafica_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[PlacaMadre] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [socket] NVARCHAR(60) NOT NULL,
    [tipo_ram] NVARCHAR(40) NOT NULL,
    [formato] NVARCHAR(60) NOT NULL,
    CONSTRAINT [PlacaMadre_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[MemoriaRAM] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [tipo] NVARCHAR(40) NOT NULL,
    [capacidad] INT NOT NULL,
    CONSTRAINT [MemoriaRAM_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[FuentePoder] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [vatios] INT NOT NULL,
    [certificacion] NVARCHAR(100) NOT NULL,
    CONSTRAINT [FuentePoder_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[Almacenamiento] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [tipo] NVARCHAR(60) NOT NULL,
    [capacidad] INT NOT NULL,
    CONSTRAINT [Almacenamiento_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[Gabinete] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [formato] NVARCHAR(60) NOT NULL,
    CONSTRAINT [Gabinete_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateTable
CREATE TABLE [dbo].[Refrigeracion] (
    [componente_id] NVARCHAR(100) NOT NULL,
    [tipo] NVARCHAR(60) NOT NULL,
    [tdp_soportado] INT,
    CONSTRAINT [Refrigeracion_pkey] PRIMARY KEY CLUSTERED ([componente_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Componente_categoria_precio_id_idx] ON [dbo].[Componente]([categoria], [precio], [id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Componente_marca_idx] ON [dbo].[Componente]([marca]);

-- AddForeignKey
ALTER TABLE [dbo].[Procesador] ADD CONSTRAINT [Procesador_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TarjetaGrafica] ADD CONSTRAINT [TarjetaGrafica_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlacaMadre] ADD CONSTRAINT [PlacaMadre_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MemoriaRAM] ADD CONSTRAINT [MemoriaRAM_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FuentePoder] ADD CONSTRAINT [FuentePoder_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Almacenamiento] ADD CONSTRAINT [Almacenamiento_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Gabinete] ADD CONSTRAINT [Gabinete_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Refrigeracion] ADD CONSTRAINT [Refrigeracion_componente_id_fkey] FOREIGN KEY ([componente_id]) REFERENCES [dbo].[Componente]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
