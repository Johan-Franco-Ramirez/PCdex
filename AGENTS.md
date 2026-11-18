# Protecciones para trabajar en PCdex

- Revisar git status antes de editar y conservar los cambios existentes del usuario.
- No ejecutar git reset --hard, git clean, borrados recursivos ni sobrescribir archivos del usuario sin una solicitud explicita para esa accion.
- Antes de una migracion que pueda perder datos, verificar destino, disponer de una copia recuperable y obtener autorizacion especifica. No ejecutar prisma migrate reset, db push --accept-data-loss, DROP DATABASE ni docker compose down -v como parte de instalaciones o diagnosticos.
- No cambiar el proveedor de Prisma ni migrar SQL Server a MySQL como efecto secundario de instalar herramientas.
- No mostrar secretos, publicar archivos .env ni incluir credenciales en argumentos de comandos, ejemplos o commits.
- Descargar aplicaciones desde el proveedor oficial; verificar la firma digital antes de ejecutar instaladores. No desactivar antivirus, firewall, TLS ni controles de Windows para instalar.
- Conservar aplicaciones e instaladores fuera del repositorio; instalar dependencias npm en el backend o frontend correspondiente.
- Publicar bases locales solamente en 127.0.0.1. No abrir puertos del firewall automaticamente. Usar un usuario de aplicacion con privilegios limitados, distinto de root/sa.
- No ejecutar npm audit fix --force ni actualizaciones mayores automaticas. Revisar compatibilidad y probar los cambios.
- No crear servicios de pago ni desplegar a produccion como parte de la preparacion local.
- Informar por separado lo instalado, lo configurado, lo probado y lo bloqueado.
- Documentar el trabajo en docs: mantener el índice, el estado, la bitácora y los documentos temáticos actualizados; explicar qué se hizo, cómo, por qué, archivos, pruebas, resultados y pendientes, distinguiendo hechos de suposiciones.
- Conservar bitácoras, diagnósticos, guías técnicas y registros de seguimiento dentro de docs/seguimiento; mantener los documentos oficiales en docs y actualizar los índices al añadir documentos.
- Para cada pull solicitado, registrar las revisiones y cambios observados comparando las referencias reales antes y después. Respetar modificaciones locales y no ejecutar un pull si no se han evaluado posibles conflictos.
- Proponer tareas para Jira con descripción, pasos, criterios de aceptación y dependencias; no afirmar que fueron creadas si solo se prepararon localmente.
