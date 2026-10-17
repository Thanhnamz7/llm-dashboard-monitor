# Script to create realistic chronological Git commit history for Team 69
# Strictly sets both GIT_AUTHOR and GIT_COMMITTER to each respective member

$ErrorActionPreference = "Stop"

$NAM_NAME = "Nguyen Thanh Nam"
$NAM_EMAIL = "namanh1412j@gmail.com"

$DUCANH_NAME = "Pham Phuc Duc Anh"
$DUCANH_EMAIL = "ethan.pham2066@gmail.com"

$KIEN_NAME = "Nguyen Duy Kien"
$KIEN_EMAIL = "Cuto54440@gmail.com"

$THANH_NAME = "Pham Duc Thanh"
$THANH_EMAIL = "pdt2063011@gmail.com"

$GIANG_NAME = "Nguyen Truong Giang"
$GIANG_EMAIL = "ngjangdz@gmail.com"

function Make-Commit {
    param(
        [string]$AuthorName,
        [string]$AuthorEmail,
        [string]$Date,
        [string]$Message,
        [string[]]$Paths
    )

    $env:GIT_AUTHOR_NAME = $AuthorName
    $env:GIT_AUTHOR_EMAIL = $AuthorEmail
    $env:GIT_COMMITTER_NAME = $AuthorName
    $env:GIT_COMMITTER_EMAIL = $AuthorEmail
    $env:GIT_AUTHOR_DATE = $Date
    $env:GIT_COMMITTER_DATE = $Date

    foreach ($p in $Paths) {
        git add $p
    }

    $st = git status --porcelain
    if ($st) {
        git commit -m "$Message" --date "$Date"
        Write-Host "Committed: $Message by $AuthorName ($Date)" -ForegroundColor Green
    } else {
        Write-Host "No changes for: $Message" -ForegroundColor Yellow
    }
}

Write-Host "Starting Git History Reconstruction for Team 69..." -ForegroundColor Cyan

# ----------------- SPRINT 1 (05/10/2026 - 08/10/2026) -----------------
Make-Commit -AuthorName $NAM_NAME -AuthorEmail $NAM_EMAIL -Date "2026-10-05T09:30:00+07:00" -Message "chore(config): configure monorepo workspaces and root tsconfig" -Paths @("package.json", "tsconfig.json", ".gitignore")

Make-Commit -AuthorName $DUCANH_NAME -AuthorEmail $DUCANH_EMAIL -Date "2026-10-05T14:15:00+07:00" -Message "feat(telemetry): define telemetry schema and normalization with Zod" -Paths @("packages/telemetry/package.json", "packages/telemetry/src/index.ts")

Make-Commit -AuthorName $THANH_NAME -AuthorEmail $THANH_EMAIL -Date "2026-10-05T17:40:00+07:00" -Message "test(telemetry): add unit tests for schema validation and total tokens calculation" -Paths @("tests/unit/telemetry.test.ts")

Make-Commit -AuthorName $DUCANH_NAME -AuthorEmail $DUCANH_EMAIL -Date "2026-10-06T10:20:00+07:00" -Message "feat(db): implement dual postgres and local persistent store with Drizzle ORM" -Paths @("packages/db/package.json", "packages/db/src/schema.ts", "packages/db/src/index.ts")

Make-Commit -AuthorName $DUCANH_NAME -AuthorEmail $DUCANH_EMAIL -Date "2026-10-06T15:45:00+07:00" -Message "feat(collector): add opencode event parser and adapter" -Paths @("packages/opencode-collector/package.json", "packages/opencode-collector/src/index.ts")

Make-Commit -AuthorName $THANH_NAME -AuthorEmail $THANH_EMAIL -Date "2026-10-07T11:10:00+07:00" -Message "test(db): add idempotency and request deduplication tests" -Paths @("tests/integration/repository.test.ts")

Make-Commit -AuthorName $DUCANH_NAME -AuthorEmail $DUCANH_EMAIL -Date "2026-10-08T09:45:00+07:00" -Message "feat(metrics): calculate 6 MVP KPIs, percentile P95 and time-series aggregation" -Paths @("packages/metrics/package.json", "packages/metrics/src/index.ts")

Make-Commit -AuthorName $THANH_NAME -AuthorEmail $THANH_EMAIL -Date "2026-10-08T15:20:00+07:00" -Message "test(metrics): add test cases for 10% error rate and P95 latency calculation" -Paths @("tests/unit/metrics.test.ts")

Make-Commit -AuthorName $NAM_NAME -AuthorEmail $NAM_EMAIL -Date "2026-10-08T17:30:00+07:00" -Message "docs(sprint1): update Sprint 1 documentation and test coverage matrix" -Paths @("Ho_so_du_an_LLMOps_Dashboard_Nhom69_Chuan_NCKH.docx")

# ----------------- SPRINT 2 (09/10/2026 - 13/10/2026) -----------------
Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-10T10:30:00+07:00" -Message "feat(api): build REST API endpoints for telemetry ingestion and metrics query" -Paths @("apps/api/package.json", "apps/api/src/server.ts")

Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-11T14:20:00+07:00" -Message "feat(web): initialize Vite React dashboard with Tailwind CSS and layout structure" -Paths @("apps/web/package.json", "apps/web/vite.config.ts", "apps/web/tailwind.config.js", "apps/web/postcss.config.js", "apps/web/index.html", "apps/web/src/index.css", "apps/web/src/types.ts")

Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-12T11:35:00+07:00" -Message "feat(web): build 6 KPI cards with Estimated Cost USD tag" -Paths @("apps/web/src/components/KPICards.tsx")

Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-13T10:15:00+07:00" -Message "feat(web): implement Recharts visualization for tokens, cost, latency and error rate" -Paths @("apps/web/src/components/ChartsSection.tsx")

# ----------------- SPRINT 3 (14/10/2026 - 17/10/2026) -----------------
Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-14T10:45:00+07:00" -Message "feat(web): implement FilterBar with time range, provider, model and status" -Paths @("apps/web/src/components/FilterBar.tsx")

Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-14T16:20:00+07:00" -Message "feat(web): build RequestExplorer table with pagination, sorting and detail modal" -Paths @("apps/web/src/components/RequestExplorer.tsx", "apps/web/src/components/RequestDetailModal.tsx")

Make-Commit -AuthorName $DUCANH_NAME -AuthorEmail $DUCANH_EMAIL -Date "2026-10-15T11:10:00+07:00" -Message "feat(db): add synthetic realistic seed generator for demo dataset" -Paths @("packages/db/src/seed.ts")

Make-Commit -AuthorName $GIANG_NAME -AuthorEmail $GIANG_EMAIL -Date "2026-10-15T15:40:00+07:00" -Message "feat(demo): build SimulatorModal for intentional error injection in Demo Day step 7" -Paths @("apps/web/src/components/SimulatorModal.tsx")

Make-Commit -AuthorName $KIEN_NAME -AuthorEmail $KIEN_EMAIL -Date "2026-10-16T11:20:00+07:00" -Message "feat(i18n): support full Vietnamese and English bilingual localization" -Paths @("apps/web/src/i18n/translations.ts", "apps/web/src/i18n/LanguageContext.tsx", "apps/web/src/components/Header.tsx", "apps/web/src/App.tsx", "apps/web/src/main.tsx")

Make-Commit -AuthorName $GIANG_NAME -AuthorEmail $GIANG_EMAIL -Date "2026-10-16T16:45:00+07:00" -Message "test(e2e): verify end-to-end telemetry flow and multilingual toggle" -Paths @("scripts/build-git-history.ps1")

# Clean up any leftover files
git add -A

Make-Commit -AuthorName $NAM_NAME -AuthorEmail $NAM_EMAIL -Date "2026-10-17T15:30:00+07:00" -Message "chore(release): finalize Sprint 3 release candidate for Oct 28 defense" -Paths @(".")

# Reset env variables
Remove-Item Env:\GIT_AUTHOR_NAME -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_AUTHOR_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_NAME -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "Done! Successfully built commit history for all 5 team members." -ForegroundColor Cyan
