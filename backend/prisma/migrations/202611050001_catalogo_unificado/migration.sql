-- Los registros históricos requieren conversión explícita: sus especificaciones
-- pueden ser incompletas y sus ID pueden coincidir con los de Componente.
-- Detenerse evita ocultar registros o asignar ensambles a otra pieza.
IF EXISTS (SELECT 1 FROM [dbo].[Component])
    THROW 51000, 'Hay datos en el catalogo Component anterior. Se requiere migracion y revision de colisiones antes de continuar.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  ALTER TABLE [dbo].[Componente] ADD
    [modelo] NVARCHAR(300),
    [descripcion] NVARCHAR(2000),
    [imagen] NVARCHAR(2000),
    [priceSource] NVARCHAR(300),
    [priceReferenceDate] NVARCHAR(10),
    [priceKind] NVARCHAR(20),
    [activo] BIT NOT NULL CONSTRAINT [Componente_activo_df] DEFAULT 1,
    [revision] INT NOT NULL CONSTRAINT [Componente_revision_df] DEFAULT 1,
    [specsExtra] NVARCHAR(MAX);

  ALTER TABLE [dbo].[BuildItem] DROP CONSTRAINT [BuildItem_componentId_fkey];
  ALTER TABLE [dbo].[BuildItem] DROP CONSTRAINT [BuildItem_pkey];
  ALTER TABLE [dbo].[BuildItem] ALTER COLUMN [componentId] NVARCHAR(100) NOT NULL;
  ALTER TABLE [dbo].[BuildItem] ADD CONSTRAINT [BuildItem_pkey] PRIMARY KEY CLUSTERED ([buildId], [componentId]);
  ALTER TABLE [dbo].[BuildItem] ADD CONSTRAINT [BuildItem_componentId_fkey]
    FOREIGN KEY ([componentId]) REFERENCES [dbo].[Componente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
