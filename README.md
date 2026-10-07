# ONUR CO-OPPORATION — Sales Command

A sales-first dashboard for recording apparel sales, studio expenses, a password-protected bin, a full records search, and profit & loss charts. Records are saved in a Lovable Cloud database behind a single login.

## Pages

| Page | What it does |
| --- | --- |
| `/` | Welcome page with a Sign in button |
| `/auth` | Username + password login (single account) |
| `/dashboard` | Record sales, metrics, recent sales, menu with expenses and bin |
| `/records` | All records with category / date / item filters and screenshot uploads |
| `/reports` | Chart board: spending by type, sold vs spent per day, daily profit & loss |

## Run locally

```bash
bun install      # or: npm install
bun run dev      # opens http://localhost:8080
```

---

## Deploy as a static site on Render (step by step)

The whole app runs in the browser and talks to the cloud database directly, so it can be hosted as a static site.

> Note: this build setup was not tested on Render before being written up. If the site loads blank, check step 1 and the Rewrite rule in step 6 first.

### 1. Switch the build to static (SPA) mode

In `vite.config.ts`, add `spa: { enabled: true }` inside `tanstackStart`:

```ts
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true },
  },
});
```

Commit and push this change to GitHub.

### 2. Build it once on your computer (optional check)

```bash
bun install
bun run build
```

You should see a `dist/client` folder containing `_shell.html` and an `assets` folder.

### 3. Create the site on Render

1. Go to <https://dashboard.render.com> and sign in with GitHub.
2. Click **New +** and choose **Static Site**.
3. Pick this GitHub repository and click **Connect**.

### 4. Fill in the build settings

| Field | Value |
| --- | --- |
| Name | `onur-sales` (anything you like) |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist/client` |

### 5. Add environment variables

Under **Advanced → Add Environment Variable**, add these three (copy the values from the `.env` file in this repo):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

These are public keys, so it's safe to use them in a static site.

### 6. Make every page link work

After the site is created, open it in Render, then go to **Redirects/Rewrites** and add:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/_shell.html` | Rewrite |

Without this, refreshing `/dashboard` or `/records` shows "Not Found".

### 7. Deploy

Click **Create Static Site** (or **Manual Deploy → Deploy latest commit**). When it finishes, open the `.onrender.com` link and sign in with your ONUR account.

### 8. Updating later

Every push to `main` on GitHub rebuilds and redeploys the site automatically.
