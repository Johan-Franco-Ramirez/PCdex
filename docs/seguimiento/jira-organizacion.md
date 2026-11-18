# Propuesta para organizar PCdex en Jira

Esta es una propuesta para copiar o adaptar en el espacio PCdex. No se han creado elementos en Jira ni se ha comprobado su configuración; los nombres de tipos y estados pueden variar según el proyecto.

## Estructura sugerida

Usar una épica para un objetivo grande, historias para capacidades que aportan valor, tareas para trabajo técnico y errores para fallos observados. Agrupar por módulos: documentación, infraestructura, catálogo, compatibilidad, usuarios y seguridad.

Flujo inicial sugerido: **Por hacer → En progreso → En revisión → Finalizado**. Una tarea se considera terminada cuando cumple sus criterios, tiene pruebas adecuadas y la documentación correspondiente está actualizada. Ajustar estos estados al flujo disponible en Jira.

## Elementos iniciales propuestos

### Épica: Preparación y estabilidad de PCdex

Objetivo: disponer de un entorno local entendible, verificable y documentado para el equipo.

### Error: Investigar contenedores Docker detenidos

**Descripción:** los contenedores de backend y frontend de la configuración funcional aparecen detenidos con códigos 255 y 1. La causa aún no se conoce.

**Pasos:** recopilar registros, identificar los proyectos y contenedores activos, comprobar la base de datos y su volumen, diagnosticar el fallo y aplicar la corrección adecuada sin borrar datos.

**Criterios de aceptación:**

- Se documenta la causa con evidencia de registros.
- La aplicación correcta inicia y puede abrirse en la URL correspondiente.
- Se comprueba la conexión con la base esperada y se preservan sus datos.
- Se registran los comandos ejecutados, las pruebas y resultados.

**Dependencia:** disponibilidad de Docker Desktop y acceso a registros. Prioridad sugerida: alta para el desarrollo local.

### Tarea: Documentar arquitectura y flujo de trabajo

**Descripción:** mantener un índice, estado técnico, bitácora y explicaciones de módulos y funciones conforme se revisen.

**Criterios de aceptación:** documentación enlazada desde `docs/README.md`, fecha y estado claros, decisiones pendientes identificadas y ningún secreto publicado. Estado sugerido: en progreso; esta estructura ya tiene una primera versión.

### Tarea: Definir el destino de la base de datos

**Descripción:** comparar la implementación actual SQL Server con el destino propuesto MySQL/Aiven y documentar una decisión y plan de migración.

**Criterios de aceptación:** proveedor acordado, impactos en Prisma y datos identificados, estrategia de respaldo y pruebas documentada. No implica ejecutar la migración.

## Plantilla de incidencia

```text
Tipo:
Título:
Objetivo o problema:
Contexto y evidencia:
Pasos de trabajo o reproducción:
Resultado esperado:
Criterios de aceptación:
Dependencias:
Prioridad:
Responsable:
Evidencia de pruebas y enlaces a documentación:
```

Los responsables, estimaciones y fechas deben acordarse con el equipo; no se asignan automáticamente.
