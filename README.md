# Studio Ledger

can you
Build a modern, responsive, mobile-first Web Application for tracking daily business activities, material purchases, and sales records. The design should feel sleek, industrial, and minimal—suited for a custom apparel and fashion design studio.
---
### 1. UI/UX & Design System
- **Theme & Color Palette**: Dark Slate (#0f172a), Cool Gray (#f8fafc), Accent Primary (#1e293b), and Success Green (#16a34a).
- **Typography**: Clean, high-readability sans-serif (Inter, System UI, or Geist).
- **Layout**: Single-page dashboard layout with a responsive container (max-width: 960px). Mobile-friendly with large touch targets for quick typing.
---
### 2. Core Features & Functional Requirements
#### A. Smart Entry Form
- **Category Selector**: Dropdown options: `Sales`, `Material Purchased`, `Graphics Purchased`, `Accessories`, `Transportation`.
- **Date Input**: Auto-defaults to today's date, but selectable.
- **Item Search & Auto-Pricing (Price Catalog)**:
  - Input field for item description with auto-complete/suggestions.
  - Automatic price detection: Pre-configure a lookup dictionary so typing standard items (e.g., "Black material" -> 2,300, "Forest material" -> 2,300, "White Flex" -> 1,800, "Joggers rope" -> 100, "Rim black" -> 3,000) automatically populates the Unit Price field.
  - Allow manual unit price overrides.
- **Quantity Field**: Number input for yards, pieces, or units (default: 1).
- **Add Record Button**: Instantly calculates `Total = Quantity x Unit Price` and adds the entry.
#### B. Categorized Data Display
- Dynamically render separate, clean data tables for each category (`Sales`, `Material Purchased`, etc.).
- **Table Columns**: Date, Description, Quantity/Yards, Unit Price (₦), Total (₦), Actions (Delete).
- Automatically sort records within each table by date (most recent first).
- Include subtotal calculations at the bottom of every category table.
- Display a prominent **Grand Total** across all categories at the bottom of the dashboard.
#### C. Local Storage Persistence
- Save all entries directly to browser `localStorage` so data persists when refreshed or reopened on mobile or desktop.
- Provide a "Clear All Records" button with a confirmation popup.
#### D. Document Export (.doc / Word)
- Add a prominent "Export Report to .DOC" button.
- Clicking export generates a clean, well-structured Word-compatible HTML file containing:
  - Styled headers and report date.
  - Formatted category tables with borderlines, aligned headers, and subtotal rows.
  - Currency formatting in Nigerian Naira (₦).
  - Overall Grand Total block at the end.
---
### 3. Tech Stack Requirements
- Framework: Next.js / React with Tailwind CSS (or pure HTML/CSS/JS with Lucide icons if single-file).
- Client-side document generation (using Blob export or html-docx-js).
- State management for local storage syncing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0686d65d-17fd-46d0-95bd-586edc1409d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
