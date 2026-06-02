# Deployment: Vercel And AWS Route 53

This is the handoff for deploying `brendenbrusberg.com` from GitHub to Vercel and pointing the AWS Route 53 DNS records at it.

## Project Values

```text
GitHub repo: brusberg/brendenbrusberg.com
Branch to deploy first: codex/simant-one-screen-rebuild
Framework preset: Vite
Package manager: pnpm
Root directory: .
Install command: pnpm install --frozen-lockfile
Build command: pnpm run build
Output directory: dist
Primary domain: brendenbrusberg.com
Secondary domain: www.brendenbrusberg.com
Recommended canonical domain: brendenbrusberg.com
```

## Local Preflight

```sh
cd ~/Documents/github/brendenbrusberg.com
pnpm install
pnpm run build
```

If the build passes, push the branch:

```sh
git status
git push -u origin codex/simant-one-screen-rebuild
```

## Vercel Project Setup

1. Open `https://vercel.com/dashboard`.
2. Create or import a project from GitHub.
3. Select `brusberg/brendenbrusberg.com`.
4. Use these settings:
   - Framework Preset: `Vite`
   - Root Directory: `.`
   - Install Command: `pnpm install --frozen-lockfile`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Environment Variables: none for the current static site
5. Deploy the pushed branch as a preview first.
6. Open the Vercel preview URL and verify:
   - resume button opens the PDF
   - GitHub, LinkedIn, and email links work
   - simulation renders and does not cover text
   - mobile viewport scroll/drag behavior is acceptable

When the preview is right, either merge the branch to the production branch or promote the preview in Vercel.

## Add Domains In Vercel

In the Vercel project:

```text
Settings -> Domains
```

Add:

```text
brendenbrusberg.com
www.brendenbrusberg.com
```

Use `brendenbrusberg.com` as the primary/canonical domain and set `www.brendenbrusberg.com` to redirect to it.

Important: copy the exact DNS values Vercel shows in the dashboard. Vercel's current docs say an apex/root domain uses an `A` record, a subdomain uses a `CNAME`, and Vercel may provide a project-specific recommended apex IP from Domain Settings.

## AWS Route 53 Setup

Open AWS:

```text
Route 53 -> Hosted zones -> brendenbrusberg.com
```

If no public hosted zone exists:

1. Create hosted zone.
2. Domain name: `brendenbrusberg.com`.
3. Type: public hosted zone.
4. Copy the four Route 53 name servers from the hosted zone `NS` record.
5. Make sure the registered domain uses those exact name servers.

If the domain is registered in Route 53:

```text
Route 53 -> Registered domains -> brendenbrusberg.com -> Edit name servers
```

If the domain is registered elsewhere, update name servers at that registrar.

## DNS Records

In the authoritative Route 53 hosted zone, create or update:

```text
Name: brendenbrusberg.com
Type: A
Value: exact Vercel apex IP shown in Vercel Domain Settings
TTL: 300
Routing policy: Simple
```

```text
Name: www.brendenbrusberg.com
Type: CNAME
Value: exact Vercel CNAME target shown in Vercel Domain Settings
TTL: 300
Routing policy: Simple
```

Do not create a `CNAME` at `brendenbrusberg.com`; DNS does not allow a CNAME at the zone apex. Use the `A` record Vercel shows.

Remove or replace conflicting old records:

```text
brendenbrusberg.com old A records
brendenbrusberg.com old AAAA records
www.brendenbrusberg.com old A records
www.brendenbrusberg.com old AAAA records
www.brendenbrusberg.com old CNAME records
```

Preserve unrelated records:

```text
MX records
TXT records for SPF/DKIM/DMARC/email verification
records for other subdomains
```

If CAA records already exist on the root domain, add:

```text
0 issue "letsencrypt.org"
```

Do not add CAA only for fun; add it when existing CAA records would otherwise block Vercel/Let's Encrypt certificate issuance.

## Verify DNS

After saving Route 53 records:

```sh
dig NS brendenbrusberg.com +short
dig A brendenbrusberg.com +short
dig CNAME www.brendenbrusberg.com +short
```

Expected:

```text
NS returns Route 53 name servers.
A returns the Vercel apex IP from the Vercel dashboard.
CNAME returns the Vercel target from the Vercel dashboard.
```

Then:

```sh
curl -I https://brendenbrusberg.com
curl -I https://www.brendenbrusberg.com
```

Expected:

```text
HTTPS works.
Primary domain returns 200.
www redirects to the primary domain.
```

DNS may work quickly, but certificate and DNS propagation can still take time. If Vercel shows a warning, wait a bit and re-check the exact Route 53 values.

## Troubleshooting

If Vercel says the apex/root domain is not configured, check the `A` record value against Vercel Domain Settings.

If `www` fails, check that `www` has exactly one active `CNAME` and no conflicting `A`/`AAAA` records.

If SSL fails and the domain has CAA records, add `0 issue "letsencrypt.org"`.

If DNS looks impossible, check for duplicate Route 53 hosted zones for `brendenbrusberg.com`. Only the hosted zone whose `NS` records match the registrar is authoritative.

If deploy fails, confirm:

```text
Root Directory: .
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm run build
Output Directory: dist
pnpm-lock.yaml is committed
```

## Official References

- Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- Vercel custom domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Vercel A records and CAA: https://vercel.com/kb/guide/a-record-and-caa-with-vercel
- AWS Route 53 public hosted zones: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html
- AWS Route 53 record types: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html
