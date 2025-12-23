# Deployment Guide: GitHub Pages + AWS Domain

This guide covers deploying your Vite project to GitHub Pages with automatic CI/CD and connecting a custom domain from AWS Route 53.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [GitHub Repository Setup](#3-github-repository-setup)
4. [GitHub Actions CI/CD Workflow](#4-github-actions-cicd-workflow)
5. [GitHub Pages Configuration](#5-github-pages-configuration)
6. [AWS Route 53 Domain Setup](#6-aws-route-53-domain-setup)
7. [HTTPS & SSL Certificate](#7-https--ssl-certificate)
8. [Troubleshooting](#8-troubleshooting)
9. [References & Learning Resources](#9-references--learning-resources)

---

## 1. Overview

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Your Code     │      │  GitHub Actions  │      │  GitHub Pages   │
│   (Push to      │─────▶│  (Build & Deploy)│─────▶│  (Static Host)  │
│    main branch) │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                            │
                                                            │ CNAME/A Records
                                                            ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   User Browser  │◀─────│  AWS Route 53    │◀─────│ yourdomain.com  │
│                 │      │  (DNS Routing)   │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

### What Happens When You Push Code

1. You push code to `main` branch
2. GitHub Actions automatically triggers
3. Workflow installs dependencies, builds project
4. Built files are deployed to `gh-pages` branch
5. GitHub Pages serves the files
6. DNS routes your custom domain to GitHub Pages

---

## 2. Prerequisites

Before starting, ensure you have:

- [ ] A GitHub account
- [ ] Git installed locally
- [ ] Your project pushed to a GitHub repository
- [ ] A domain registered in AWS Route 53 (or transferred there)
- [ ] AWS Console access with Route 53 permissions

---

## 3. GitHub Repository Setup

### Step 1: Create a GitHub Repository

If you haven't already:

```bash
# Initialize git in your project
cd /path/to/your/project
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit"

# Add remote origin (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 2: Configure Vite for GitHub Pages

Update your `vite.config.ts` to work with your domain:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // For custom domain, use '/'
  // For username.github.io/repo-name, use '/repo-name/'
  base: '/',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Important:** 
- If using a custom domain (yourdomain.com): `base: '/'`
- If NOT using a custom domain: `base: '/your-repo-name/'`

---

## 4. GitHub Actions CI/CD Workflow

### Step 1: Create the Workflow Directory

```bash
mkdir -p .github/workflows
```

### Step 2: Create the Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

# Trigger on push to main branch
on:
  push:
    branches:
      - main
  
  # Allow manual trigger from Actions tab
  workflow_dispatch:

# Set permissions for GITHUB_TOKEN
permissions:
  contents: read
  pages: write
  id-token: write

# Only allow one deployment at a time
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  # Build job
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build project
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  # Deploy job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Understanding the Workflow

| Section | Purpose |
|---------|---------|
| `on: push: branches: main` | Triggers when code is pushed to main |
| `workflow_dispatch` | Allows manual trigger from GitHub UI |
| `permissions` | Grants access to deploy to Pages |
| `concurrency` | Prevents multiple deployments running simultaneously |
| `pnpm/action-setup` | Installs pnpm package manager |
| `actions/setup-node` | Installs Node.js with caching |
| `pnpm build` | Runs your build script |
| `upload-pages-artifact` | Packages the dist folder |
| `deploy-pages` | Deploys to GitHub Pages |

### Step 3: Create pnpm Lock File

Ensure you have a lock file for reproducible builds:

```bash
pnpm install
```

This creates `pnpm-lock.yaml` which should be committed.

---

## 5. GitHub Pages Configuration

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"

![GitHub Pages Settings](https://docs.github.com/assets/cb-28535/mw-1440/images/help/pages/publishing-source-actions.webp)

### Step 2: Create CNAME File

Create `public/CNAME` with your domain:

```
yourdomain.com
```

**Note:** No `https://` or trailing slash. Just the bare domain.

For subdomain (like `www`):
```
www.yourdomain.com
```

### Step 3: First Deployment

Push your changes to trigger the first deployment:

```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

Check the **Actions** tab in your repository to monitor the deployment.

---

## 6. AWS Route 53 Domain Setup

### Step 1: Access Route 53

1. Log into [AWS Console](https://console.aws.amazon.com/)
2. Search for "Route 53" and open it
3. Click **Hosted zones** in the left sidebar
4. Click on your domain name

### Step 2: Configure DNS Records

You need to add records that point your domain to GitHub Pages.

#### Option A: Apex Domain (yourdomain.com)

For the root domain, add **A records** pointing to GitHub's IP addresses:

| Record Type | Name | Value |
|-------------|------|-------|
| A | @ (or leave blank) | 185.199.108.153 |
| A | @ (or leave blank) | 185.199.109.153 |
| A | @ (or leave blank) | 185.199.110.153 |
| A | @ (or leave blank) | 185.199.111.153 |

**To add each record:**

1. Click **Create record**
2. Leave **Record name** empty (for apex domain)
3. **Record type**: A
4. **Value**: Enter one IP address
5. **TTL**: 300 (or default)
6. Click **Create records**

Repeat for all 4 IP addresses.

#### Option B: Subdomain (www.yourdomain.com)

For www or other subdomains, add a **CNAME record**:

| Record Type | Name | Value |
|-------------|------|-------|
| CNAME | www | YOUR_USERNAME.github.io |

**To add:**

1. Click **Create record**
2. **Record name**: `www`
3. **Record type**: CNAME
4. **Value**: `YOUR_USERNAME.github.io` (replace with your GitHub username)
5. **TTL**: 300
6. Click **Create records**

#### Recommended: Both Apex AND www

For best user experience, configure both:

```
A Records (apex domain → GitHub IPs):
    yourdomain.com → 185.199.108.153
    yourdomain.com → 185.199.109.153
    yourdomain.com → 185.199.110.153
    yourdomain.com → 185.199.111.153

CNAME Record (www → GitHub):
    www.yourdomain.com → YOUR_USERNAME.github.io
```

### Step 3: Verify DNS Configuration

After adding records, verify with these commands:

```bash
# Check A records
dig yourdomain.com +short

# Should return:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

# Check CNAME
dig www.yourdomain.com +short

# Should return:
# YOUR_USERNAME.github.io
```

Or use online tools:
- [DNS Checker](https://dnschecker.org/)
- [WhatsMyDNS](https://www.whatsmydns.net/)

**Note:** DNS propagation can take 1-48 hours, though usually completes within 30 minutes.

---

## 7. HTTPS & SSL Certificate

### GitHub Pages Automatic HTTPS

GitHub Pages provides free SSL certificates via Let's Encrypt.

1. Go to repository **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Click **Save**
4. Wait for DNS check to complete (may take a few minutes)
5. Check the box **Enforce HTTPS**

![Enforce HTTPS](https://docs.github.com/assets/cb-32942/mw-1440/images/help/pages/enforce-https-checkbox.webp)

### Troubleshooting HTTPS

If HTTPS option is greyed out:
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check that CNAME file matches your domain exactly

---

## 8. Troubleshooting

### Common Issues

#### Build Fails: "Cannot find module"

Ensure all dependencies are in `package.json`:
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "Update lock file"
git push
```

#### 404 Error on Deployed Site

1. Check `base` in `vite.config.ts` matches your setup
2. Verify CNAME file is in `public/` folder
3. Check GitHub Pages source is set to "GitHub Actions"

#### DNS Not Resolving

1. Verify records in Route 53 are correct
2. Wait for propagation (use DNS Checker)
3. Clear browser cache or try incognito mode
4. Try: `nslookup yourdomain.com`

#### "Domain not verified" in GitHub

Add a TXT record for domain verification:
1. Go to GitHub Settings → Pages
2. Copy the verification TXT value
3. In Route 53, add TXT record with that value

#### Deployment Stuck

1. Check Actions tab for error logs
2. Ensure `pnpm-lock.yaml` is committed
3. Verify Node version matches your local setup

### Checking Deployment Status

```bash
# View GitHub Actions logs
gh run list --limit 5

# View specific run
gh run view <run-id>

# Or just check the Actions tab in your browser
```

---

## 9. References & Learning Resources

### Official Documentation

| Resource | URL |
|----------|-----|
| GitHub Pages Docs | https://docs.github.com/en/pages |
| GitHub Actions Docs | https://docs.github.com/en/actions |
| Vite Deployment Guide | https://vitejs.dev/guide/static-deploy.html#github-pages |
| AWS Route 53 Docs | https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ |

### GitHub Pages Specific

| Topic | Resource |
|-------|----------|
| Custom Domain Setup | [GitHub Docs: Managing custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) |
| Troubleshooting Custom Domains | [GitHub Docs: Troubleshooting](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages) |
| GitHub Actions for Pages | [GitHub Docs: Publishing with Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow) |

### AWS Route 53

| Topic | Resource |
|-------|----------|
| Route 53 Getting Started | [AWS: Get a Domain](https://aws.amazon.com/getting-started/hands-on/get-a-domain/) |
| Creating Hosted Zones | [AWS Docs: Hosted Zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html) |
| DNS Record Types | [AWS Docs: Record Types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html) |

### Video Tutorials

| Topic | Link |
|-------|------|
| GitHub Actions Crash Course | [YouTube: Fireship - GitHub Actions](https://www.youtube.com/watch?v=eB0nUzAI7M8) |
| Deploy to GitHub Pages | [YouTube: Web Dev Simplified](https://www.youtube.com/watch?v=SKXkC4SqtRk) |
| AWS Route 53 Tutorial | [YouTube: AWS Route 53 Basics](https://www.youtube.com/watch?v=10JKpg-eqZU) |
| CI/CD Explained | [YouTube: TechWorld with Nana](https://www.youtube.com/watch?v=scEDHsr3APg) |

### Tools

| Tool | Purpose | URL |
|------|---------|-----|
| DNS Checker | Verify DNS propagation | https://dnschecker.org/ |
| WhatsMyDNS | Global DNS lookup | https://www.whatsmydns.net/ |
| SSL Checker | Verify HTTPS certificate | https://www.sslshopper.com/ssl-checker.html |
| GitHub CLI | Manage repos from terminal | https://cli.github.com/ |

---

## Quick Reference Checklist

### Initial Setup
- [ ] Create GitHub repository
- [ ] Configure `vite.config.ts` with correct `base`
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Create `public/CNAME` with your domain
- [ ] Push to main branch

### GitHub Settings
- [ ] Enable GitHub Pages (Source: GitHub Actions)
- [ ] Add custom domain in Pages settings
- [ ] Enable "Enforce HTTPS" (after DNS propagates)

### AWS Route 53
- [ ] Add A records (4 GitHub IPs) for apex domain
- [ ] Add CNAME record for www subdomain
- [ ] Verify DNS propagation

### Verify Deployment
- [ ] Check Actions tab for successful build
- [ ] Visit https://yourdomain.com
- [ ] Verify HTTPS works (padlock icon)
- [ ] Test www.yourdomain.com redirects properly

---

## Example: Complete DNS Configuration

For domain `example.com`:

```
┌──────────────────────────────────────────────────────────────────┐
│                    AWS Route 53 - Hosted Zone                     │
├──────────┬──────────┬─────────────────────────┬──────────────────┤
│ Name     │ Type     │ Value                   │ TTL              │
├──────────┼──────────┼─────────────────────────┼──────────────────┤
│ (empty)  │ A        │ 185.199.108.153         │ 300              │
│ (empty)  │ A        │ 185.199.109.153         │ 300              │
│ (empty)  │ A        │ 185.199.110.153         │ 300              │
│ (empty)  │ A        │ 185.199.111.153         │ 300              │
│ www      │ CNAME    │ username.github.io      │ 300              │
└──────────┴──────────┴─────────────────────────┴──────────────────┘
```

**Result:**
- `example.com` → GitHub Pages ✓
- `www.example.com` → GitHub Pages ✓
- HTTPS enabled automatically ✓
- Auto-deploys on every push ✓

---

*Last updated: December 2024*


