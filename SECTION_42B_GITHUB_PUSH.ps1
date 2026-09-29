# ============================================================
# SECTION 42B
# GITHUB REPOSITORY INITIALIZATION + FIRST PUSH
# MANDYA GROUNDWATER AI WEB PLATFORM
# ============================================================

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

# ------------------------------------------------------------
# 0. CONFIGURATION
# ------------------------------------------------------------

$RepoPath = "C:\Users\bhara\project\SECTION_41_FINAL_GITHUB_WEB_DEPLOYMENT_PACKAGE\MANDYA_GROUNDWATER_AI_WEB_PLATFORM"

$GitHubOwner = "dschapparad-max"

$GitHubRepo = "MANDYA_GROUNDWATER_AI_WEB_PLATFORM"

$GitHubFullName = "$GitHubOwner/$GitHubRepo"

$ExpectedOrigin = "https://github.com/$GitHubOwner/$GitHubRepo.git"

$CommitMessage = "Initial deployment package"

# ------------------------------------------------------------
# 1. HEADER
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================"
Write-Host "SECTION 42B"
Write-Host "GITHUB REPOSITORY INITIALIZATION + FIRST PUSH"
Write-Host "============================================================"
Write-Host ""

# ------------------------------------------------------------
# 2. REPOSITORY PATH QA
# ------------------------------------------------------------

Write-Host "STEP 1 - REPOSITORY PATH QA"

if (-not (Test-Path -LiteralPath $RepoPath -PathType Container)) {
    throw "FAIL: Repository directory not found: $RepoPath"
}

Write-Host "PASS - Repository directory exists"
Write-Host $RepoPath
Write-Host ""

# ------------------------------------------------------------
# 3. GIT QA
# ------------------------------------------------------------

Write-Host "STEP 2 - GIT QA"

$GitCommand = Get-Command git -ErrorAction SilentlyContinue

if (-not $GitCommand) {
    throw "FAIL: Git is not available in PATH."
}

$GitVersion = (& git --version).Trim()

Write-Host "Git: $GitVersion"
Write-Host "PASS - Git available"
Write-Host ""

# ------------------------------------------------------------
# 4. GITHUB CLI QA
# ------------------------------------------------------------

Write-Host "STEP 3 - GITHUB CLI QA"

$GhCommand = Get-Command gh -ErrorAction SilentlyContinue

if (-not $GhCommand) {
    throw "FAIL: GitHub CLI (gh) is not installed or not in PATH."
}

$GhVersion = (& gh --version | Select-Object -First 1).Trim()

Write-Host "GitHub CLI: $GhVersion"
Write-Host "PASS - GitHub CLI available"
Write-Host ""

# ------------------------------------------------------------
# 5. GITHUB AUTHENTICATION
# ------------------------------------------------------------

Write-Host "STEP 4 - GITHUB AUTHENTICATION QA"

$AuthOutput = & gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: GitHub CLI authentication is not active."
}

Write-Host "PASS - GitHub CLI authentication is active"
Write-Host ""

# ------------------------------------------------------------
# 6. LOCAL GIT INITIALIZATION
# ------------------------------------------------------------

Write-Host "STEP 5 - LOCAL GIT INITIALIZATION"

$GitDir = Join-Path $RepoPath ".git"

if (-not (Test-Path -LiteralPath $GitDir -PathType Container)) {

    & git -C $RepoPath init

    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: git init failed."
    }

    Write-Host "PASS - Git repository initialized"

}
else {

    Write-Host "PASS - Existing local Git repository detected"

}

# ------------------------------------------------------------
# 7. MAIN BRANCH
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 6 - MAIN BRANCH CONFIGURATION"

& git -C $RepoPath branch -M main

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Could not configure main branch."
}

Write-Host "PASS - main branch configured"

# ------------------------------------------------------------
# 8. GIT USER IDENTITY
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 7 - GIT IDENTITY"

& git -C $RepoPath config user.name "Dhanush S Chapparad"

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Could not configure Git user.name."
}

& git -C $RepoPath config user.email "dschapparad@gmail.com"

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Could not configure Git user.email."
}

$ConfiguredName = (& git -C $RepoPath config user.name).Trim()
$ConfiguredEmail = (& git -C $RepoPath config user.email).Trim()

Write-Host "Name : $ConfiguredName"
Write-Host "Email: $ConfiguredEmail"
Write-Host "PASS - Git identity configured"

# ------------------------------------------------------------
# 9. REMOTE CONFIGURATION
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 8 - GITHUB REMOTE CONFIGURATION"

$ExistingOrigin = $null

$RemoteNames = @(
    & git -C $RepoPath remote
)

if ($LASTEXITCODE -eq 0 -and $RemoteNames -contains "origin") {

    $ExistingOrigin = (
        & git -C $RepoPath remote get-url origin
    ).Trim()

}

if ($LASTEXITCODE -eq 0 -and $ExistingOrigin) {

    Write-Host "Existing origin:"
    Write-Host $ExistingOrigin

    if ($ExistingOrigin -ne $ExpectedOrigin) {
        throw "FAIL: Existing origin does not match expected repository. Existing=$ExistingOrigin Expected=$ExpectedOrigin"
    }

    Write-Host "PASS - Existing origin is correct"

}
else {

    Write-Host "No origin configured."

    # --------------------------------------------------------
    # 9A. GITHUB REPOSITORY EXISTENCE
    # --------------------------------------------------------

    Write-Host ""
    Write-Host "STEP 9 - GITHUB REPOSITORY EXISTENCE"

    $PreviousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    $RepoCheckOutput = & gh repo view $GitHubFullName --json nameWithOwner,url,isPrivate 2>$null
    $RepoCheckExit = $LASTEXITCODE

    $ErrorActionPreference = $PreviousErrorActionPreference

    $RepoExists = ($LASTEXITCODE -eq 0)

    if ($RepoExists) {

        Write-Host "PASS - GitHub repository already exists"

    }
    else {

        Write-Host "GitHub repository not found."
        Write-Host "Creating repository..."

        & gh repo create $GitHubFullName --public --description "Mandya District Groundwater AI Decision-Support Platform"

        if ($LASTEXITCODE -ne 0) {
            throw "FAIL: GitHub repository creation failed."
        }

        Write-Host "PASS - GitHub repository created"
    }

    # --------------------------------------------------------
    # 9B. ADD ORIGIN
    # --------------------------------------------------------

    & git -C $RepoPath remote add origin $ExpectedOrigin

    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: Could not add GitHub origin."
    }

    Write-Host "PASS - origin configured"
}

# ------------------------------------------------------------
# 10. FINAL REMOTE QA
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 10 - FINAL REMOTE QA"

$FinalOrigin = (& git -C $RepoPath remote get-url origin).Trim()

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Unable to read origin."
}

if ($FinalOrigin -ne $ExpectedOrigin) {
    throw "FAIL: Final origin mismatch. Actual=$FinalOrigin Expected=$ExpectedOrigin"
}

Write-Host "Origin:"
Write-Host $FinalOrigin
Write-Host "PASS - Remote verified"

# ------------------------------------------------------------
# 11. STATUS BEFORE STAGING
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 11 - PRE-STAGING STATUS"

& git -C $RepoPath status --short

# ------------------------------------------------------------
# 12. STAGE
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 12 - STAGING PACKAGE"

& git -C $RepoPath add .

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: git add failed."
}

Write-Host "PASS - Package staged"

# ------------------------------------------------------------
# 13. COMMIT
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 13 - COMMIT"

$StagedFiles = @(git -C $RepoPath diff --cached --name-only)

if ($StagedFiles.Count -gt 0) {

    Write-Host "Staged files: $($StagedFiles.Count)"

    & git -C $RepoPath commit -m $CommitMessage

    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: git commit failed."
    }

    Write-Host "PASS - Commit created"

}
else {

    $ExistingHead = (& git -C $RepoPath rev-parse --verify HEAD 2>$null).Trim()

    if ($LASTEXITCODE -ne 0 -or -not $ExistingHead) {
        throw "FAIL: No staged files and no existing commit."
    }

    Write-Host "No new changes."
    Write-Host "PASS - Existing commit will be used"
}

# ------------------------------------------------------------
# 14. LOCAL HEAD QA
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 14 - LOCAL COMMIT QA"

$HeadCommit = (& git -C $RepoPath rev-parse HEAD).Trim()

if ($LASTEXITCODE -ne 0 -or $HeadCommit.Length -ne 40) {
    throw "FAIL: Invalid local HEAD commit."
}

Write-Host "HEAD: $HeadCommit"
Write-Host "PASS - Local commit verified"

# ------------------------------------------------------------
# 15. PUSH
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 15 - FIRST GITHUB PUSH"

& git -C $RepoPath push -u origin main

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: git push failed."
}

Write-Host "PASS - main branch pushed to GitHub"

# ------------------------------------------------------------
# 16. REMOTE COMMIT QA
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 16 - REMOTE COMMIT VERIFICATION"

& git -C $RepoPath fetch origin

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: git fetch failed."
}

$RemoteCommit = (& git -C $RepoPath rev-parse origin/main).Trim()

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Could not resolve origin/main."
}

Write-Host "Local HEAD : $HeadCommit"
Write-Host "Remote main: $RemoteCommit"

if ($HeadCommit -ne $RemoteCommit) {
    throw "FAIL: Local and remote commits do not match."
}

Write-Host "PASS - Local and remote commits match"

# ------------------------------------------------------------
# 17. GITHUB REPOSITORY QA
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 17 - GITHUB REPOSITORY QA"

$RemoteRepoJSON = & gh repo view $GitHubFullName --json nameWithOwner,url,isPrivate,defaultBranchRef

if ($LASTEXITCODE -ne 0) {
    throw "FAIL: Could not inspect GitHub repository."
}

$RemoteRepo = $RemoteRepoJSON | ConvertFrom-Json

if ($RemoteRepo.nameWithOwner -ne $GitHubFullName) {
    throw "FAIL: GitHub repository identity mismatch."
}

if ($RemoteRepo.isPrivate) {
    throw "FAIL: Repository is private. Expected public repository."
}

Write-Host "Repository: $($RemoteRepo.nameWithOwner)"
Write-Host "URL: $($RemoteRepo.url)"

if ($RemoteRepo.defaultBranchRef) {
    Write-Host "Default branch: $($RemoteRepo.defaultBranchRef.name)"
}

Write-Host "PASS - GitHub repository verified"

# ------------------------------------------------------------
# 18. GITHUB ACTIONS WORKFLOW DETECTION
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 18 - GITHUB ACTIONS WORKFLOW QA"

$WorkflowDir = Join-Path $RepoPath ".github\workflows"

$WorkflowFiles = @(Get-ChildItem -LiteralPath $WorkflowDir -File -ErrorAction SilentlyContinue)

if ($WorkflowFiles.Count -eq 0) {
    throw "FAIL: No GitHub Actions workflow files found."
}

Write-Host "Workflow files: $($WorkflowFiles.Count)"

foreach ($WorkflowFile in $WorkflowFiles) {
    Write-Host "  $($WorkflowFile.Name)"
}

Write-Host "PASS - GitHub Actions workflow files detected"

# ------------------------------------------------------------
# 19. FINAL WORKTREE QA
# ------------------------------------------------------------

Write-Host ""
Write-Host "STEP 19 - FINAL WORKTREE QA"

$FinalStatus = @(git -C $RepoPath status --porcelain)

if ($FinalStatus.Count -gt 0) {

    Write-Host "WARNING - Working tree contains changes:"
    $FinalStatus | ForEach-Object {
        Write-Host "  $_"
    }

}
else {

    Write-Host "PASS - Working tree clean"
}

# ------------------------------------------------------------
# 20. FINAL RESULT
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================"
Write-Host "SECTION 42B FINAL HARD QA: PASS"
Write-Host "SECTION 42B GITHUB REPOSITORY: PASS"
Write-Host "SECTION 42B FIRST PUSH: PASS"
Write-Host "============================================================"
Write-Host ""

Write-Host "Git version:"
Write-Host "  $GitVersion"

Write-Host "GitHub CLI:"
Write-Host "  $GhVersion"

Write-Host "Repository:"
Write-Host "  https://github.com/$GitHubOwner/$GitHubRepo"

Write-Host "Local HEAD:"
Write-Host "  $HeadCommit"

Write-Host "Remote main:"
Write-Host "  $RemoteCommit"

Write-Host ""
Write-Host "SCIENTIFIC MUTATION: FALSE"
Write-Host "MODEL TRAINING: FALSE"
Write-Host "MODEL INFERENCE: FALSE"
Write-Host "SECTION 8 MODIFICATION: FALSE"
Write-Host "D8 PROMOTION: FALSE"
Write-Host "NEW MANAGEMENT RANKING: FALSE"

Write-Host ""
Write-Host "NEXT STEP: VERIFY GITHUB ACTIONS"
Write-Host "============================================================"
