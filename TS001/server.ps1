# Lightweight PowerShell Local HTTP Server for Teacher E-Portfolio
$port = 8080
$path = $PSScriptRoot
if (-not $path) { $path = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "🎓 Teacher E-Portfolio Local Server is RUNNING!" -ForegroundColor Green
    Write-Host "👉 URL สำหรับทดสอบ: http://localhost:$port" -ForegroundColor Yellow
    Write-Host "👉 หรือเปิดไฟล์ตรง: $path\index.html" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "กด Ctrl + C ในหน้าต่างนี้เพื่อหยุดการทำงาน" -ForegroundColor Gray

    # Open Browser automatically
    Start-Process $prefix

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
        $filePath = Join-Path $path ($rawUrl.TrimStart('/'))

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".htm"  { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif"  { "image/gif" }
                ".svg"  { "image/svg+xml" }
                ".pdf"  { "application/pdf" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Server stopped or error: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
}
