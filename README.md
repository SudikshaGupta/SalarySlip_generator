# Payroll Pro Website

This is a browser-based version of the Employee Payroll / Salary Slip Generator from the C++ program.

## Features

- Add employee with unique EmpID validation
- Update employee overtime hours
- Generate payslip for a selected EmpID
- Calculate total monthly salary payout
- Show highest paid employee
- Search employees by exact name
- Delete employee record
- Display all employee records
- Save data in browser `localStorage`

## Payroll Rules

- OT rate: `Rs. 200` per hour
- Gross salary: `Basic Pay + (OT Hours x 200)`
- Tax:
  - `0%` for gross salary up to `Rs. 30,000`
  - `10%` for gross salary from `Rs. 30,001` to `Rs. 60,000`
  - `20%` for gross salary above `Rs. 60,000`

## Run Locally

Open [index.html](C:\Users\Sudiksha\Desktop\oppps da2\index.html) in a browser.

If you want a local server, run:

```powershell
python -m http.server 5500
```

Then visit `http://localhost:5500`.

## Deploy

This is a static website, so it can be deployed directly to:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

Upload or connect these files:

- `index.html`
- `styles.css`
- `script.js`
