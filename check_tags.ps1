# Check that all blog posts have the <!-- more --> tag

Write-Host "Checking blog posts for <!-- more --> tags..." -ForegroundColor Cyan

$missingTagFiles = @()
$postsPath = "docs\blog\posts"

if (-not (Test-Path $postsPath)) {
    Write-Host "Error: Could not find path: $postsPath" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $postsPath -Filter "*.md" -Recurse

foreach ($file in $files) {
    # Skip index pages which are not posts
    if ($file.Name -eq "index.md") {
        continue
    }

    $content = Get-Content -Path $file.FullName -Raw
    if ($content -notmatch "<!-- more -->") {
        $missingTagFiles += $file.FullName
        Write-Host "Missing <!-- more --> tag in: $($file.FullName)" -ForegroundColor Red
    }
}

if ($missingTagFiles.Count -eq 0) {
    Write-Host "Success: All blog posts have <!-- more --> tags" -ForegroundColor Green
    exit 0
}
else {
    Write-Host ""
    Write-Host "Found $($missingTagFiles.Count) blog post(s) missing <!-- more --> tags" -ForegroundColor Yellow
    Write-Host "Please add <!-- more --> tags to separate the excerpt from the full content."
    exit 1
}
