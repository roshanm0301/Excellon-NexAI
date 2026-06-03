# Simplified E2E Test - Using WebClient to avoid prompts
$baseUrl = "http://localhost:9080/api/v1/monitoring"

$client = New-Object System.Net.WebClient
$client.Headers.Add("x-tenant-id", "test-tenant")
$client.Headers.Add("x-user-id", "test-user")
$client.Headers.Add("x-role", "admin")

Write-Host "`nE2E MONITORING API TESTS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$tests = @(
    @{Name="Rule Coverage"; Url="$baseUrl/rules/coverage?entity_type=&days=7"},
    @{Name="Top Fired Rules"; Url="$baseUrl/rules/top-fired?limit=10&days=7"},
    @{Name="Dead Rules"; Url="$baseUrl/rules/dead-rules?days=30"},
    @{Name="Rule Execution Log"; Url="$baseUrl/rules/execution-log?limit=10&offset=0&include_simulations=false"},
    @{Name="Rule Execution Stats"; Url="$baseUrl/rules/execution-stats?days=7"},
    @{Name="Workflow Health"; Url="$baseUrl/workflow/health?days=7"},
    @{Name="Workflow Step Metrics"; Url="$baseUrl/workflow/step-metrics?days=7"},
    @{Name="Workflow Execution Log"; Url="$baseUrl/workflow/execution-log?limit=10&offset=0"},
    @{Name="SLA Breaches"; Url="$baseUrl/workflow/sla-breaches?limit=10"}
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "`n[$($test.Name)]" -ForegroundColor Yellow -NoNewline
    try {
        $response = $client.DownloadString($test.Url)
        $json = $response | ConvertFrom-Json
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "  Response: $($response.Substring(0, [Math]::Min(100, $response.Length)))..." -ForegroundColor Gray
        $passed++
    }
    catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "RESULTS: $passed/$($tests.Count) tests passed" -ForegroundColor $(if ($failed -eq 0) {"Green"} else {"Yellow"})
if ($failed -eq 0) {
    Write-Host "✓ ALL MONITORING APIs WORKING!" -ForegroundColor Green
} else {
    Write-Host "✗ $failed test(s) failed" -ForegroundColor Red
}
