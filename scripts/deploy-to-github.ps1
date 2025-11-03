# Automated Deployment Script for GitHub Actions
# Prepares and pushes code to trigger automated builds

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Sticker Guard - GitHub Actions Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify prerequisites
Write-Host "Step 1: Verifying prerequisites..." -ForegroundColor Yellow

# Check git repository
if (!(Test-Path .git)) {
    Write-Host "✗ Not a git repository" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor White
    exit 1
}

Write-Host "✓ Git repository verified" -ForegroundColor Green

# Check if remote is configured
$remotes = git remote -v
if (!$remotes) {
    Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
    Write-Host "Add remote with: git remote add origin <your-repo-url>" -ForegroundColor White
    Read-Host "Press Enter when remote is configured"
}

Write-Host "✓ Remote repository configured" -ForegroundColor Green

# Step 2: Verify google-services.json
Write-Host ""
Write-Host "Step 2: Verifying google-services.json..." -ForegroundColor Yellow

if (!(Test-Path android\app\google-services.json)) {
    Write-Host "✗ google-services.json not found" -ForegroundColor Red
    Write-Host "Download from Firebase Console and place in android/app/" -ForegroundColor White
    exit 1
}

Write-Host "✓ google-services.json found" -ForegroundColor Green

# Step 3: Check GitHub Secrets setup
Write-Host ""
Write-Host "Step 3: Verify GitHub Secrets..." -ForegroundColor Yellow
Write-Host "Have you added these secrets to GitHub?" -ForegroundColor White
Write-Host "  1. GOOGLE_SERVICES_JSON" -ForegroundColor Gray
Write-Host "  2. ANDROID_KEYSTORE_BASE64" -ForegroundColor Gray
Write-Host "  3. ANDROID_KEYSTORE_PASSWORD" -ForegroundColor Gray
Write-Host "  4. ANDROID_KEY_ALIAS" -ForegroundColor Gray
Write-Host "  5. ANDROID_KEY_PASSWORD" -ForegroundColor Gray
Write-Host ""

$secretsConfirm = Read-Host "All secrets configured? (yes/no)"
if ($secretsConfirm -ne "yes") {
    Write-Host "⚠️  Configure secrets first!" -ForegroundColor Yellow
    Write-Host "See: GITHUB_ACTIONS_SETUP.md for instructions" -ForegroundColor White
    exit 0
}

Write-Host "✓ GitHub Secrets confirmed" -ForegroundColor Green

# Step 4: Choose build type
Write-Host ""
Write-Host "Step 4: Choose deployment type..." -ForegroundColor Yellow
Write-Host "1. Debug Build (push to main/develop)" -ForegroundColor White
Write-Host "2. Release Build (create version tag)" -ForegroundColor White
Write-Host ""

$buildType = Read-Host "Select option (1 or 2)"

# Step 5: Prepare commit
Write-Host ""
Write-Host "Step 5: Preparing commit..." -ForegroundColor Yellow

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "✓ Changes detected" -ForegroundColor Green
    Write-Host ""
    Write-Host "Modified files:" -ForegroundColor White
    git status --short
    Write-Host ""

    $commitMsg = Read-Host "Enter commit message"
    if (!$commitMsg) {
        $commitMsg = "chore: Update Android build configuration"
    }

    git add .
    git commit -m "$commitMsg"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Commit failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
}

# Step 6: Deploy
Write-Host ""
Write-Host "Step 6: Deploying to GitHub..." -ForegroundColor Yellow

if ($buildType -eq "1") {
    # Debug build
    Write-Host "Pushing to main branch..." -ForegroundColor White

    $branch = git branch --show-current
    git push origin $branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Code pushed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Debug build triggered!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View build progress:" -ForegroundColor Yellow
        Write-Host "1. Go to your GitHub repository" -ForegroundColor White
        Write-Host "2. Click 'Actions' tab" -ForegroundColor White
        Write-Host "3. See 'Android Build (Debug)' workflow" -ForegroundColor White
        Write-Host ""
        Write-Host "Build artifacts will be available in ~7-10 minutes" -ForegroundColor Gray
    } else {
        Write-Host "✗ Push failed" -ForegroundColor Red
        exit 1
    }

} elseif ($buildType -eq "2") {
    # Release build
    Write-Host ""
    $version = Read-Host "Enter version (e.g., 1.0.0)"
    if (!$version) {
        Write-Host "✗ Version is required" -ForegroundColor Red
        exit 1
    }

    $tag = "v$version"

    Write-Host "Creating tag: $tag" -ForegroundColor White
    git tag $tag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Tag creation failed" -ForegroundColor Red
        Write-Host "Tag might already exist. Use: git tag -d $tag to remove" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Pushing tag to GitHub..." -ForegroundColor White
    git push origin $tag

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Tag pushed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Release build triggered!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View build progress:" -ForegroundColor Yellow
        Write-Host "1. Go to your GitHub repository" -ForegroundColor White
        Write-Host "2. Click 'Actions' tab" -ForegroundColor White
        Write-Host "3. See 'Android Build (Release)' workflow" -ForegroundColor White
        Write-Host ""
        Write-Host "GitHub Release will be created automatically" -ForegroundColor Gray
        Write-Host "APK and AAB files will be attached to the release" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Build completion time: ~10-15 minutes" -ForegroundColor Gray
    } else {
        Write-Host "✗ Tag push failed" -ForegroundColor Red
        git tag -d $tag
        exit 1
    }
} else {
    Write-Host "✗ Invalid option" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
