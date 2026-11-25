#!/usr/bin/env bash
# Builds the SPA and uploads it to the S3 site bucket (DECISIONS D-25: S3 website, no CloudFront).
#
#   SITE_BUCKET=<bucket> scripts/deploy-s3.sh
#
# The build reads .env.aws.local (gitignored, `vite build --mode aws`) with the public values from
# infra's foundation outputs: VITE_COGNITO_*, VITE_API_BASE_URL (the ALB). Hashed assets are cached
# for a year; index.html and the Cognito bounce pages are never cached.
set -euo pipefail

cd "$(dirname "$0")/.."
: "${SITE_BUCKET:?set SITE_BUCKET (infra: terraform output site_bucket)}"
[ -f .env.aws.local ] || { echo "error: .env.aws.local is missing (see .env.example)" >&2; exit 1; }

pnpm build --mode aws

aws s3 sync dist/assets "s3://$SITE_BUCKET/assets" --delete \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync dist "s3://$SITE_BUCKET" --delete --exclude "assets/*" \
  --cache-control "no-cache"

echo "Deployed to http://$SITE_BUCKET.s3-website-us-east-1.amazonaws.com/" >&2
