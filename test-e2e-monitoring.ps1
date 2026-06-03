# E2E Monitoring API Test Script
# Tests all 9 monitoring endpoints with dev-mode headers

$baseUrl = "http://localhost:9080/api/v1/monitoring"
$headers = @{
    "x-tenant-id" = "test-tenant"
    "x-user-id" = "test-user"
    "x-role" = "admin"
    "Content-Type" = "application/json"
}

$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "✓ Response:" -ForegroundColor Green
        $content | ConvertTo-Json -Depth 3 -Compress | Write-Host -ForegroundColor White
        
        return @{
            Name = $Name
            Status = "PASS"
            StatusCode = $response.StatusCode
            ResponseSize = $response.Content.Length
        }
    }
    catch {
        Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# Test 1: Rule Coverage
$results += Test-Endpoint -Name "Rule Coverage" -Url "$baseUrl/rules/coverage?entity_type=&days=7"

# Test 2: Top Fired Rules
$results += Test-Endpoint -Name "Top Fired Rules" -Url "$baseUrl/rules/top-fired?limit=10&days=7"

# Test 3: Dead Rules
$results += Test-Endpoint -Name "Dead Rules" -Url "$baseUrl/rules/dead-rules?days=30"

# Test 4: Rule Execution Log
$results += Test-Endpoint -Name "Rule Execution Log" -Url "$baseUrl/rules/execution-log?limit=10&offset=0&include_simulations=false"

# Test 5: Rule Execution Stats
$results += Test-Endpoint -Name "Rule Execution Stats" -Url "$baseUrl/rules/execution-stats?days=7"

# Test 6: Workflow Health
$results += Test-Endpoint -Name "Workflow Health" -Url "$baseUrl/workflow/health?days=7"

# Test 7: Workflow Step Metrics
$results += Test-Endpoint -Name "Workflow Step Metrics" -Url "$baseUrl/workflow/step-metrics?days=7"

# Test 8: Workflow Execution Log
$results += Test-Endpoint -Name "Workflow Execution Log" -Url "$baseUrl/workflow/execution-log?limit=10&offset=0"

# Test 9: SLA Breaches
$results += Test-Endpoint -Name "SLA Breaches" -Url "$baseUrl/workflow/sla-breaches?limit=10"

# Summary
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`n"
if ($failed -eq 0) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
