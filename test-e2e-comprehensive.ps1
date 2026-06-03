# Comprehensive E2E Test Suite for Excellon NexAI Platform
# Tests all milestones: Entity Designer + M1-M6

$baseUrl = "http://localhost:9080"
$headers = @{
    "x-tenant-id" = "test-tenant"
    "x-user-id" = "test-user"
    "x-role" = "admin"
    "Content-Type" = "application/json"
}

$client = New-Object System.Net.WebClient
$client.Headers.Add("x-tenant-id", "test-tenant")
$client.Headers.Add("x-user-id", "test-user")
$client.Headers.Add("x-role", "admin")
$client.Headers.Add("Content-Type", "application/json")

$results = @()
$testData = @{}

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Title.PadRight(58)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [scriptblock]$Validator = $null
    )
    
    Write-Host "`n▶ Testing: $Name" -ForegroundColor Yellow
    
    try {
        if ($Method -eq "GET") {
            $response = $client.DownloadString($Url)
        } else {
            $client.Headers["Content-Type"] = "application/json"
            $response = $client.UploadString($Url, $Method, $Body)
        }
        
        $json = $response | ConvertFrom-Json
        
        # Run validator if provided
        if ($Validator) {
            $validationResult = & $Validator $json
            if (-not $validationResult) {
                throw "Validation failed"
            }
        }
        
        Write-Host "  ✓ PASS" -ForegroundColor Green
        Write-Host "  Response: $($response.Substring(0, [Math]::Min(150, $response.Length)))..." -ForegroundColor Gray
        
        $script:results += @{
            Name = $Name
            Status = "PASS"
            Method = $Method
            Url = $Url
        }
        
        return $json
    }
    catch {
        Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:results += @{
            Name = $Name
            Status = "FAIL"
            Method = $Method
            Url = $Url
            Error = $_.Exception.Message
        }
        
        return $null
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# ENTITY DESIGNER TESTS
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "ENTITY DESIGNER E2E TESTS"

# Test 1: Create Entity Artifact
$entityPayload = @{
    artifact_type = "entity_schema"
    artifact_key = "test_customer"
    entity_type = "customer"
    version = "1.0.0"
    status = "draft"
    payload = @{
        entity_type = "customer"
        display_name = "Customer"
        attributes = @(
            @{
                key = "first_name"
                label = "First Name"
                type = "text"
                required = $true
            },
            @{
                key = "email"
                label = "Email"
                type = "email"
                required = $true
            }
        )
    }
} | ConvertTo-Json -Depth 10

$entity = Test-API -Name "Create Customer Entity" -Method "POST" `
    -Url "$baseUrl/api/v1/artifacts" -Body $entityPayload

if ($entity) {
    $testData.entityId = $entity.id
}

# Test 2: Get Entity List
Test-API -Name "List All Entities" -Method "GET" `
    -Url "$baseUrl/api/v1/artifacts?artifact_type=entity_schema"

# Test 3: Get Specific Entity
if ($testData.entityId) {
    Test-API -Name "Get Customer Entity by ID" -Method "GET" `
        -Url "$baseUrl/api/v1/artifacts/$($testData.entityId)"
}

# Test 4: Publish Entity (Compile)
if ($testData.entityId) {
    Test-API -Name "Publish Customer Entity" -Method "POST" `
        -Url "$baseUrl/api/v1/artifacts/$($testData.entityId)/publish"
}

# ═══════════════════════════════════════════════════════════════════════════
# M1: RULE ENGINE V2 TESTS
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "M1: RULE ENGINE V2 BACKEND TESTS"

# Test 5: Create Rule Set
$rulePayload = @{
    rule_set_key = "customer_validation"
    entity_type = "customer"
    version = "1.0.0"
    rules = @(
        @{
            rule_key = "email_required"
            condition = @{
                op = "empty"
                field = "email"
            }
            action = "BLOCK"
            message = "Email is required"
        }
    )
} | ConvertTo-Json -Depth 10

$ruleSet = Test-API -Name "Create Rule Set" -Method "POST" `
    -Url "$baseUrl/api/v1/admin/rules" -Body $rulePayload

if ($ruleSet) {
    $testData.ruleSetId = $ruleSet.id
}

# Test 6: List Rules
Test-API -Name "List All Rule Sets" -Method "GET" `
    -Url "$baseUrl/api/v1/admin/rules?entity_type=customer"

# Test 7: Get Rule Set by ID
if ($testData.ruleSetId) {
    Test-API -Name "Get Rule Set by ID" -Method "GET" `
        -Url "$baseUrl/api/v1/admin/rules/$($testData.ruleSetId)"
}

# Test 8: Simulate Rules (M1 Critical)
$simulatePayload = @{
    entity_type = "customer"
    trigger = "on_change"
    payload = @{
        first_name = "John"
        email = ""
    }
} | ConvertTo-Json -Depth 5

Test-API -Name "Simulate Rules (Empty Email)" -Method "POST" `
    -Url "$baseUrl/api/v1/admin/rules/simulate" -Body $simulatePayload

# ═══════════════════════════════════════════════════════════════════════════
# M3: BUSINESS WORKFLOW ENGINE V2 TESTS
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "M3: BUSINESS WORKFLOW ENGINE V2 TESTS"

# Test 9: Create Workflow Definition
$workflowPayload = @{
    workflow_key = "customer_onboarding"
    name = "Customer Onboarding"
    entity_type = "customer"
    steps = @(
        @{
            step_key = "verify_email"
            step_type = "approval"
            name = "Verify Email"
        },
        @{
            step_key = "activate"
            step_type = "automated"
            name = "Activate Account"
        }
    )
} | ConvertTo-Json -Depth 10

$workflow = Test-API -Name "Create Workflow Definition" -Method "POST" `
    -Url "$baseUrl/api/v1/processes" -Body $workflowPayload

if ($workflow) {
    $testData.workflowId = $workflow.id
}

# Test 10: List Workflows
Test-API -Name "List All Workflows" -Method "GET" `
    -Url "$baseUrl/api/v1/processes"

# Test 11: Get Workflow by ID
if ($testData.workflowId) {
    Test-API -Name "Get Workflow by ID" -Method "GET" `
        -Url "$baseUrl/api/v1/processes/$($testData.workflowId)"
}

# Test 12: Trigger Workflow Instance (Critical)
if ($testData.workflowId -and $testData.entityId) {
    $triggerPayload = @{
        workflow_key = "customer_onboarding"
        entity_id = $testData.entityId
        trigger_data = @{
            initiated_by = "test-user"
        }
    } | ConvertTo-Json -Depth 5
    
    $instance = Test-API -Name "Trigger Workflow Instance" -Method "POST" `
        -Url "$baseUrl/api/v1/processes/trigger" -Body $triggerPayload
    
    if ($instance) {
        $testData.instanceId = $instance.id
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# M5: SERVICE LAYER TESTS
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "M5: SERVICE LAYER TESTS"

# Test 13: Register Service
$servicePayload = @{
    service_key = "email_service"
    name = "Email Notification Service"
    endpoint = "https://api.sendgrid.com/v3/mail"
    auth_type = "bearer"
} | ConvertTo-Json -Depth 5

Test-API -Name "Register External Service" -Method "POST" `
    -Url "$baseUrl/api/v1/services" -Body $servicePayload

# Test 14: List Services
Test-API -Name "List All Services" -Method "GET" `
    -Url "$baseUrl/api/v1/services"

# ═══════════════════════════════════════════════════════════════════════════
# ENTITY RUNTIME TESTS (Foundation for Rules & Workflows)
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "ENTITY RUNTIME CRUD TESTS"

# Test 15: Create Entity Record
$recordPayload = @{
    first_name = "Jane"
    email = "jane@example.com"
} | ConvertTo-Json

$record = Test-API -Name "Create Customer Record" -Method "POST" `
    -Url "$baseUrl/api/v1/entities/customer" -Body $recordPayload

if ($record) {
    $testData.recordId = $record.id
}

# Test 16: Get Entity Record
if ($testData.recordId) {
    Test-API -Name "Get Customer Record by ID" -Method "GET" `
        -Url "$baseUrl/api/v1/entities/customer/$($testData.recordId)"
}

# Test 17: Update Entity Record
if ($testData.recordId) {
    $updatePayload = @{
        first_name = "Jane"
        email = "jane.updated@example.com"
    } | ConvertTo-Json
    
    Test-API -Name "Update Customer Record" -Method "PUT" `
        -Url "$baseUrl/api/v1/entities/customer/$($testData.recordId)" -Body $updatePayload
}

# Test 18: List Entity Records
Test-API -Name "List All Customer Records" -Method "GET" `
    -Url "$baseUrl/api/v1/entities/customer?limit=10"

# ═══════════════════════════════════════════════════════════════════════════
# M6: MONITORING TESTS (Already tested but verify again)
# ═══════════════════════════════════════════════════════════════════════════

Write-TestHeader "M6: MONITORING & COVERAGE TESTS"

Test-API -Name "Rule Coverage Metrics" -Method "GET" `
    -Url "$baseUrl/api/v1/monitoring/rules/coverage?days=7"

Test-API -Name "Workflow Health Metrics" -Method "GET" `
    -Url "$baseUrl/api/v1/monitoring/workflow/health?days=7"

Test-API -Name "Rule Execution Log" -Method "GET" `
    -Url "$baseUrl/api/v1/monitoring/rules/execution-log?limit=10"

# ═══════════════════════════════════════════════════════════════════════════
# TEST SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      TEST SUMMARY                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "✓ Passed: $passed" -ForegroundColor Green
Write-Host "✗ Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                     FAILED TESTS                           ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "`n  ✗ $($_.Name)" -ForegroundColor Red
        Write-Host "    Method: $($_.Method) | URL: $($_.Url)" -ForegroundColor Gray
        Write-Host "    Error: $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   FINAL RESULT                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n  ✓ ALL TESTS PASSED! System is fully operational." -ForegroundColor Green
} else {
    $percentage = [math]::Round(($passed / $total) * 100, 1)
    Write-Host "`n  ⚠ $failed test(s) failed ($percentage% pass rate)" -ForegroundColor Yellow
}

Write-Host ""
