$ErrorActionPreference = 'Stop'
$mysqlBase = 'C:\Program Files\MySQL\MySQL Server 8.0'
$mysqlExe = Join-Path $mysqlBase 'bin\mysqld.exe'
if (-not (Test-Path -LiteralPath $mysqlExe)) { throw 'No se encontró MySQL Server 8.0 para esta prueba aislada.' }
$probe = [System.Net.Sockets.TcpClient]::new()
try { $probe.Connect('127.0.0.1', 33317); throw 'El puerto aislado 33317 ya está en uso.' }
catch [System.Net.Sockets.SocketException] { }
finally { $probe.Dispose() }
$testDir = Join-Path $env:TEMP ('pcdex-oauth-isolated-' + [guid]::NewGuid().ToString('N'))
$dataDir = Join-Path $testDir 'data'
New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
$bootstrapLog = Join-Path $testDir 'bootstrap.log'
& $mysqlExe '--no-defaults' '--initialize-insecure' "--basedir=$mysqlBase" "--datadir=$dataDir" '--console' 2>&1 | Out-File -LiteralPath $bootstrapLog -Encoding utf8
if ($LASTEXITCODE -ne 0) { throw 'No fue posible inicializar el MySQL de pruebas aislado.' }
$randomBytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($randomBytes)
$testPassword = [Convert]::ToHexString($randomBytes).ToLowerInvariant()
$rootBytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($rootBytes)
$rootPassword = [Convert]::ToHexString($rootBytes).ToLowerInvariant()
$initPath = Join-Path $testDir 'init.sql'
@(
  "ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';",
  "CREATE DATABASE pcdex_oauth_isolated;",
  "CREATE USER 'pcdex_test'@'127.0.0.1' IDENTIFIED BY '$testPassword';",
  "GRANT ALL PRIVILEGES ON pcdex_oauth_isolated.* TO 'pcdex_test'@'127.0.0.1';"
) | Set-Content -LiteralPath $initPath -Encoding ascii
$arguments = @(
  '--no-defaults', "--basedir=`"$mysqlBase`"", "--datadir=`"$dataDir`"", '--port=33317',
  '--bind-address=127.0.0.1', '--mysqlx=0', "--init-file=`"$initPath`"", '--console'
)
$proc = $null
try {
  $proc = Start-Process -FilePath $mysqlExe -ArgumentList $arguments -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $testDir 'out.log') -RedirectStandardError (Join-Path $testDir 'err.log')
  $ready = $false
  for ($attempt = 0; $attempt -lt 50; $attempt++) {
    if ($proc.HasExited) { throw 'El MySQL aislado terminó antes de estar listo.' }
    $probe = [System.Net.Sockets.TcpClient]::new()
    try { $probe.Connect('127.0.0.1', 33317); $ready = $true; break }
    catch [System.Net.Sockets.SocketException] { Start-Sleep -Milliseconds 400 }
    finally { $probe.Dispose() }
  }
  if (-not $ready) { throw 'El MySQL aislado no respondió dentro del tiempo esperado.' }
  $env:DATABASE_URL = "mysql://pcdex_test:${testPassword}@127.0.0.1:33317/pcdex_oauth_isolated"
  $env:PCDEX_AUTH_TEST_ISOLATED = 'yes'
  # Primero instala solo el esquema previo y crea una cuenta ficticia.
  $baseline = Join-Path $testDir 'prisma'
  $baselineMigrations = Join-Path $baseline 'migrations'
  New-Item -ItemType Directory -Path $baselineMigrations -Force | Out-Null
  Copy-Item -LiteralPath 'prisma/schema.prisma' -Destination $baseline
  Copy-Item -LiteralPath 'prisma/migrations/migration_lock.toml' -Destination $baselineMigrations
  Copy-Item -LiteralPath 'prisma/migrations/202611120001_mysql_initial' -Destination $baselineMigrations -Recurse
  & npx prisma migrate deploy --schema (Join-Path $baseline 'schema.prisma')
  if ($LASTEXITCODE -ne 0) { throw 'Falló la migración inicial en la base aislada.' }
  & node --import tsx tests/fixtures/preexisting-user.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Falló la creación de la cuenta ficticia anterior.' }
  # Después aplica la migración nueva y verifica que la cuenta anterior siga funcionando.
  & npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw 'Falló la migración en la base aislada.' }
  & npm run test:auth-mysql-isolated
  if ($LASTEXITCODE -ne 0) { throw 'Falló la prueba de autenticación en la base aislada.' }
} finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PCDEX_AUTH_TEST_ISOLATED -ErrorAction SilentlyContinue
}
