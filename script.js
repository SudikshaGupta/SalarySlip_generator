const STORAGE_KEY = "payroll-pro-employees";
const THEME_KEY = "payroll-pro-theme";
const PAYSLIP_THEME_KEY = "payroll-pro-payslip-theme";
const OT_RATE = 200;

class Employee {
  constructor(id, name, basicPay, otHours) {
    this.empID = id;
    this.name = name.trim();
    this.basicPay = basicPay >= 0 ? basicPay : 0;
    this.otHours = otHours >= 0 ? otHours : 0;
  }

  updateOT(otHours) {
    if (otHours < 0) {
      throw new Error("Invalid OT value");
    }
    this.otHours = otHours;
  }

  calculateGross() {
    return this.basicPay + this.otHours * OT_RATE;
  }

  calculateTax(gross = this.calculateGross()) {
    if (gross <= 30000) {
      return 0;
    }
    if (gross <= 60000) {
      return gross * 0.1;
    }
    return gross * 0.2;
  }

  calculateNet() {
    const gross = this.calculateGross();
    return gross - this.calculateTax(gross);
  }
}

class PayrollSystem {
  constructor() {
    this.employees = this.loadEmployees();
  }

  loadEmployees() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw).map(
        ({ empID, name, basicPay, otHours }) =>
          new Employee(Number(empID), name, Number(basicPay), Number(otHours))
      );
    } catch (error) {
      console.error("Failed to parse saved employees", error);
      return [];
    }
  }

  saveEmployees() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.employees));
  }

  findEmployeeIndex(id) {
    return this.employees.findIndex((employee) => employee.empID === id);
  }

  addEmployee(id, name, basicPay, otHours) {
    if (this.findEmployeeIndex(id) !== -1) {
      throw new Error("Employee ID already exists");
    }

    if (!name.trim()) {
      throw new Error("Employee name is required");
    }

    if (basicPay < 0 || otHours < 0 || id < 0) {
      throw new Error("Values must be non-negative");
    }

    const employee = new Employee(id, name, basicPay, otHours);
    this.employees.push(employee);
    this.saveEmployees();
    return employee;
  }

  updateOT(id, otHours) {
    const index = this.findEmployeeIndex(id);
    if (index === -1) {
      throw new Error("Employee not found");
    }

    this.employees[index].updateOT(otHours);
    this.saveEmployees();
    return this.employees[index];
  }

  generatePayslip(id) {
    const employee = this.getEmployeeById(id);
    return employee;
  }

  getEmployeeById(id) {
    const index = this.findEmployeeIndex(id);
    if (index === -1) {
      throw new Error("Employee not found");
    }
    return this.employees[index];
  }

  totalPayout() {
    return this.employees.reduce(
      (total, employee) => total + employee.calculateNet(),
      0
    );
  }

  highestPaid() {
    if (this.employees.length === 0) {
      throw new Error("No employees available");
    }

    return this.employees.reduce((highest, employee) =>
      employee.calculateNet() > highest.calculateNet() ? employee : highest
    );
  }

  searchByName(searchName) {
    const normalized = searchName.trim().toLowerCase();
    return this.employees.filter(
      (employee) => employee.name.toLowerCase().includes(normalized)
    );
  }

  deleteEmployee(id) {
    const index = this.findEmployeeIndex(id);
    if (index === -1) {
      throw new Error("Employee not found");
    }

    const [deletedEmployee] = this.employees.splice(index, 1);
    this.saveEmployees();
    return deletedEmployee;
  }

  displayAll() {
    return [...this.employees];
  }
}

const payrollSystem = new PayrollSystem();

const elements = {
  employeeForm: document.getElementById("employeeForm"),
  updateOtForm: document.getElementById("updateOtForm"),
  searchForm: document.getElementById("searchForm"),
  deleteForm: document.getElementById("deleteForm"),
  payslipForm: document.getElementById("payslipForm"),
  showPayoutBtn: document.getElementById("showPayoutBtn"),
  showHighestPaidBtn: document.getElementById("showHighestPaidBtn"),
  showAllBtn: document.getElementById("showAllBtn"),
  showSalaryChartBtn: document.getElementById("showSalaryChartBtn"),
  showTrendChartBtn: document.getElementById("showTrendChartBtn"),
  output: document.getElementById("output"),
  toast: document.getElementById("toast"),
  employeeCount: document.getElementById("employeeCount"),
  totalPayoutValue: document.getElementById("totalPayoutValue"),
  highestSalaryValue: document.getElementById("highestSalaryValue"),
  chatToggle: document.getElementById("chatToggle"),
  chatWidget: document.getElementById("chatWidget"),
  chatClose: document.getElementById("chatClose"),
  chatResponse: document.getElementById("chatResponse"),
  chatOptions: document.querySelectorAll(".chat-option"),
  searchName: document.getElementById("searchName"),
  searchSuggestions: document.getElementById("searchSuggestions"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  payslipTheme: document.getElementById("payslipTheme"),
};

const chatResponses = {
  add: "Open the Add Employee section, enter a unique Employee ID, the employee name, basic pay, and OT hours, then click Add Employee. If the ID already exists or a value is negative, the system will stop the entry.",
  payslip: "In Reports, enter the Employee ID inside Generate Payslip and click Generate. The salary slip will appear in Payroll Records with basic pay, OT hours, gross salary, tax, and net salary.",
  reports: "Total Salary Payout adds the net salary of every employee. Highest Paid Employee shows the employee with the largest net salary. Display All Employees lists every saved payroll record.",
  update: "Use Update Overtime in Employee Actions. Enter the employee ID, type the new OT hours, and click Update OT. The payroll values refresh automatically from the new overtime entry.",
  search: "Search By Name finds employees by exact name match. Delete Employee removes a record by Employee ID, so use the correct ID before deleting.",
  rules: "The system uses OT at Rs. 200 per hour. Gross salary is Basic Pay plus OT amount. Tax is 0 percent up to Rs. 30,000, 10 percent up to Rs. 60,000, and 20 percent above Rs. 60,000.",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (elements.themeToggleLabel) {
    elements.themeToggleLabel.textContent =
      theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode";
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);
}

function initializePayslipTheme() {
  const savedPayslipTheme = localStorage.getItem(PAYSLIP_THEME_KEY) || "classic";
  if (elements.payslipTheme) {
    elements.payslipTheme.value = savedPayslipTheme;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderToast(message, type) {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  window.clearTimeout(renderToast.timeoutId);
  renderToast.timeoutId = window.setTimeout(() => {
    elements.toast.className = "toast hidden";
  }, 3000);
}

function renderMetrics() {
  elements.employeeCount.textContent = payrollSystem.employees.length;
  elements.totalPayoutValue.textContent = formatCurrency(payrollSystem.totalPayout());

  const highestSalary =
    payrollSystem.employees.length > 0
      ? payrollSystem.highestPaid().calculateNet()
      : 0;
  elements.highestSalaryValue.textContent = formatCurrency(highestSalary);
}

function createEmployeeCard(employee, title = "Employee Payslip", options = {}) {
  const { includePdfButton = false, payslipTheme = "classic" } = options;
  const gross = employee.calculateGross();
  const tax = employee.calculateTax(gross);
  const net = employee.calculateNet();

  return `
    <article class="output-card payslip-card payslip-theme-${payslipTheme}" data-employee-id="${employee.empID}">
      <div class="card-topbar">
        <div>
          <h3>${title}</h3>
          <p class="output-meta">Employee ID: ${employee.empID} | Name: ${escapeHtml(employee.name)}</p>
          <p class="payslip-theme-badge">${payslipTheme.charAt(0).toUpperCase() + payslipTheme.slice(1)} Theme</p>
        </div>
        ${
          includePdfButton
            ? `<button type="button" class="secondary-btn download-pdf-btn" data-download-id="${employee.empID}" data-theme="${payslipTheme}">Download Payslip PDF</button>`
            : ""
        }
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span>Basic Pay</span>
          <strong>${formatCurrency(employee.basicPay)}</strong>
        </div>
        <div class="metric-card">
          <span>OT Hours</span>
          <strong>${employee.otHours}</strong>
        </div>
        <div class="metric-card">
          <span>Gross Salary</span>
          <strong>${formatCurrency(gross)}</strong>
        </div>
        <div class="metric-card">
          <span>Tax</span>
          <strong>${formatCurrency(tax)}</strong>
        </div>
        <div class="metric-card">
          <span>Net Salary</span>
          <strong>${formatCurrency(net)}</strong>
        </div>
      </div>
    </article>
  `;
}

function createChartCard(title, subtitle, canvasId) {
  return `
    <article class="output-card">
      <h3>${title}</h3>
      <p class="output-meta">${subtitle}</p>
      <div class="chart-shell">
        <canvas id="${canvasId}" class="chart-canvas" width="980" height="420"></canvas>
      </div>
    </article>
  `;
}

function drawAxes(context, width, height, padding) {
  context.strokeStyle = "#395476";
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(padding, padding - 8);
  context.lineTo(padding, height - padding);
  context.lineTo(width - padding + 12, height - padding);
  context.stroke();
}

function drawSalaryComparisonChart(canvas, employees) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 70;
  const values = employees.map((employee) => employee.calculateNet());
  const maxValue = Math.max(...values, 1);

  context.clearRect(0, 0, width, height);
  drawAxes(context, width, height, padding);

  context.fillStyle = "#9cbcff";
  context.font = "14px Outfit, sans-serif";
  context.fillText("Net Salary", 24, 36);

  const barAreaWidth = width - padding * 2;
  const barWidth = Math.min(90, barAreaWidth / employees.length - 22);
  const gap = (barAreaWidth - barWidth * employees.length) / Math.max(employees.length - 1, 1);

  employees.forEach((employee, index) => {
    const value = employee.calculateNet();
    const barHeight = (value / maxValue) * (height - padding * 2);
    const x = padding + index * (barWidth + gap);
    const y = height - padding - barHeight;

    const gradient = context.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, "#5e92ff");
    gradient.addColorStop(1, "#214f9c");

    context.fillStyle = gradient;
    context.fillRect(x, y, barWidth, barHeight);

    context.fillStyle = "#eef4ff";
    context.textAlign = "center";
    context.fillText(employee.name, x + barWidth / 2, height - padding + 24);
    context.fillText(
      `Rs ${(value / 1000).toFixed(1)}k`,
      x + barWidth / 2,
      y - 10
    );
  });
}

function generateMonthlyTrendData() {
  const currentTotal = payrollSystem.totalPayout();
  const base = currentTotal > 0 ? currentTotal : 50000;
  const factors = [0.86, 0.9, 0.95, 1.01, 1.07, 1.12];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return labels.map((label, index) => ({
    label,
    value: Math.round(base * factors[index]),
  }));
}

function drawTrendChart(canvas, trendData) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 70;
  const maxValue = Math.max(...trendData.map((item) => item.value), 1);

  context.clearRect(0, 0, width, height);
  drawAxes(context, width, height, padding);

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = innerWidth / Math.max(trendData.length - 1, 1);

  context.strokeStyle = "#5e92ff";
  context.lineWidth = 4;
  context.beginPath();

  trendData.forEach((item, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (item.value / maxValue) * innerHeight;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();

  trendData.forEach((item, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (item.value / maxValue) * innerHeight;

    context.fillStyle = "#d9e6ff";
    context.beginPath();
    context.arc(x, y, 6, 0, Math.PI * 2);
    context.fill();

    context.textAlign = "center";
    context.fillStyle = "#eef4ff";
    context.font = "14px Outfit, sans-serif";
    context.fillText(item.label, x, height - padding + 24);
    context.fillText(`Rs ${(item.value / 1000).toFixed(1)}k`, x, y - 12);
  });
}

function getPayslipTemplateStyles(payslipTheme) {
  const templates = {
    classic: {
      sheetBackground: "#ffffff",
      bodyBackground: "#f4f7fb",
      textColor: "#12263f",
      subtitleColor: "#51657f",
      boxBackground: "#f6faff",
      boxBorder: "#d7e1ee",
      summaryBackground: "#12263f",
      summaryColor: "#ffffff",
    },
    modern: {
      sheetBackground: "#0f1d33",
      bodyBackground: "#07111f",
      textColor: "#edf4ff",
      subtitleColor: "#a8bdd9",
      boxBackground: "#162943",
      boxBorder: "#27476f",
      summaryBackground: "linear-gradient(135deg, #2b5fba, #173a78)",
      summaryColor: "#ffffff",
    },
    minimal: {
      sheetBackground: "#ffffff",
      bodyBackground: "#eef1f5",
      textColor: "#18202a",
      subtitleColor: "#687482",
      boxBackground: "#fbfbfc",
      boxBorder: "#dde3ea",
      summaryBackground: "#f3f5f8",
      summaryColor: "#18202a",
    },
  };

  return templates[payslipTheme] || templates.classic;
}

function downloadPayslipPdf(employee, payslipTheme = "classic") {
  const gross = employee.calculateGross();
  const tax = employee.calculateTax(gross);
  const net = employee.calculateNet();
  const template = getPayslipTemplateStyles(payslipTheme);
  const printWindow = window.open("", "_blank", "width=960,height=720");

  if (!printWindow) {
    renderToast("Please allow pop-ups to download the payslip PDF", "error");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Payslip - ${escapeHtml(employee.name)}</title>
      <style>
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, sans-serif;
          background: ${template.bodyBackground};
          color: ${template.textColor};
        }
        .sheet {
          max-width: 820px;
          margin: 0 auto;
          background: ${template.sheetBackground};
          border: 1px solid ${template.boxBorder};
          border-radius: 18px;
          padding: 32px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 30px;
        }
        .subtitle {
          margin: 0 0 24px;
          color: ${template.subtitleColor};
        }
        .identity {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .box {
          padding: 16px;
          border-radius: 14px;
          background: ${template.boxBackground};
          border: 1px solid ${template.boxBorder};
        }
        .box span {
          display: block;
          color: ${template.subtitleColor};
          font-size: 13px;
          margin-bottom: 6px;
        }
        .box strong {
          font-size: 18px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          padding: 14px 12px;
          border-bottom: 1px solid ${template.boxBorder};
          text-align: left;
        }
        th {
          color: ${template.subtitleColor};
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .summary {
          margin-top: 24px;
          padding: 20px;
          border-radius: 16px;
          background: ${template.summaryBackground};
          color: ${template.summaryColor};
        }
      </style>
    </head>
    <body>
      <section class="sheet">
        <h1>Employee Payslip</h1>
        <p class="subtitle">Payroll Pro salary slip generated for monthly payroll records.</p>
        <div class="identity">
          <div class="box"><span>Employee ID</span><strong>${employee.empID}</strong></div>
          <div class="box"><span>Employee Name</span><strong>${escapeHtml(employee.name)}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Basic Pay</td><td>${formatCurrency(employee.basicPay)}</td></tr>
            <tr><td>OT Hours</td><td>${employee.otHours}</td></tr>
            <tr><td>Gross Salary</td><td>${formatCurrency(gross)}</td></tr>
            <tr><td>Tax</td><td>${formatCurrency(tax)}</td></tr>
            <tr><td>Net Salary</td><td>${formatCurrency(net)}</td></tr>
          </tbody>
        </table>
        <div class="summary">
          Net salary payable: <strong>${formatCurrency(net)}</strong>
        </div>
      </section>
      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function setOutput(html) {
  elements.output.innerHTML = html;
}

function hideSearchSuggestions() {
  elements.searchSuggestions.classList.add("hidden");
  elements.searchSuggestions.innerHTML = "";
}

function renderSearchSuggestions(matches, query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery || matches.length === 0) {
    hideSearchSuggestions();
    return;
  }

  const uniqueMatches = [...new Map(matches.map((employee) => [employee.empID, employee])).values()];

  elements.searchSuggestions.innerHTML = uniqueMatches
    .slice(0, 6)
    .map(
      (employee) => `
        <button
          type="button"
          class="search-suggestion-item"
          data-name="${escapeHtml(employee.name)}"
        >
          <span>${escapeHtml(employee.name)}</span>
          <small>ID ${employee.empID}</small>
        </button>
      `
    )
    .join("");

  elements.searchSuggestions.classList.remove("hidden");
}

function showEmptyState(message) {
  setOutput(`
    <div class="empty-state">
      <h3>No records to show</h3>
      <p>${message}</p>
    </div>
  `);
}

elements.employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const id = Number(document.getElementById("empID").value);
    const name = document.getElementById("empName").value;
    const basicPay = Number(document.getElementById("basicPay").value);
    const otHours = Number(document.getElementById("otHours").value);

    const employee = payrollSystem.addEmployee(id, name, basicPay, otHours);
    renderMetrics();
    setOutput(createEmployeeCard(employee, "New Employee Added", { payslipTheme: elements.payslipTheme.value }));
    elements.employeeForm.reset();
    renderToast("Employee added successfully", "success");
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.updateOtForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const id = Number(document.getElementById("updateEmpID").value);
    const otHours = Number(document.getElementById("updateOtHours").value);
    const employee = payrollSystem.updateOT(id, otHours);
    renderMetrics();
    setOutput(createEmployeeCard(employee, "Overtime Updated", { payslipTheme: elements.payslipTheme.value }));
    elements.updateOtForm.reset();
    renderToast("Overtime updated successfully", "success");
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const searchName = document.getElementById("searchName").value;
  const matches = payrollSystem.searchByName(searchName);
  hideSearchSuggestions();

  if (matches.length === 0) {
    showEmptyState("No employee found matching that name.");
    renderToast("No employee found", "error");
    return;
  }

  setOutput(`
    <div class="employee-list">
      ${matches.map((employee) => createEmployeeCard(employee, "Search Result", { payslipTheme: elements.payslipTheme.value })).join("")}
    </div>
  `);
  elements.searchForm.reset();
  renderToast(`${matches.length} matching employee record(s) found`, "success");
});

elements.deleteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const id = Number(document.getElementById("deleteEmpID").value);
    const employee = payrollSystem.deleteEmployee(id);
    renderMetrics();
  setOutput(`
      <article class="output-card">
        <h3>Employee Deleted</h3>
        <p class="employee-summary">
          ${employee.name} (ID: ${employee.empID}) has been removed.
        </p>
      </article>
    `);
    elements.deleteForm.reset();
    renderToast("Employee deleted successfully", "success");
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.payslipForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const id = Number(document.getElementById("payslipEmpID").value);
    const employee = payrollSystem.generatePayslip(id);
    const payslipTheme = elements.payslipTheme.value;
    localStorage.setItem(PAYSLIP_THEME_KEY, payslipTheme);
    setOutput(createEmployeeCard(employee, "Generated Payslip", { includePdfButton: true, payslipTheme }));
    elements.payslipForm.reset();
    renderToast("Payslip generated", "success");
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.showPayoutBtn.addEventListener("click", () => {
  const total = payrollSystem.totalPayout();
  setOutput(`
    <article class="output-card">
      <h3>Total Salary Payout</h3>
      <p class="employee-summary">
        Total monthly payout: <strong>${formatCurrency(total)}</strong>
      </p>
    </article>
  `);
  renderToast("Total payout calculated", "success");
});

elements.showHighestPaidBtn.addEventListener("click", () => {
  try {
    const employee = payrollSystem.highestPaid();
    setOutput(createEmployeeCard(employee, "Highest Paid Employee", { payslipTheme: elements.payslipTheme.value }));
    renderToast("Highest paid employee displayed", "success");
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.showAllBtn.addEventListener("click", () => {
  const employees = payrollSystem.displayAll();

  if (employees.length === 0) {
    showEmptyState("Add employees to start generating payroll reports.");
    renderToast("No employee records available", "error");
    return;
  }

  setOutput(`
    <div class="employee-list">
      ${employees.map((employee) => createEmployeeCard(employee, "Employee Record", { payslipTheme: elements.payslipTheme.value })).join("")}
    </div>
  `);
  renderToast("Showing all employee records", "success");
});

elements.showSalaryChartBtn.addEventListener("click", () => {
  const employees = payrollSystem.displayAll();

  if (employees.length === 0) {
    showEmptyState("Add employees to generate a salary comparison chart.");
    renderToast("No employee records available", "error");
    return;
  }

  setOutput(
    createChartCard(
      "Salary Comparison Chart",
      "Compare current net salaries across all employees.",
      "salaryComparisonChart"
    )
  );
  drawSalaryComparisonChart(document.getElementById("salaryComparisonChart"), employees);
  renderToast("Salary comparison chart generated", "success");
});

elements.showTrendChartBtn.addEventListener("click", () => {
  const trendData = generateMonthlyTrendData();
  setOutput(
    createChartCard(
      "Monthly Payout Trend",
      "Six-month simulated payout trend based on current payroll.",
      "monthlyTrendChart"
    )
  );
  drawTrendChart(document.getElementById("monthlyTrendChart"), trendData);
  renderToast("Monthly payout trend generated", "success");
});

elements.output.addEventListener("click", (event) => {
  const button = event.target.closest(".download-pdf-btn");
  if (!button) {
    return;
  }

  const employeeId = Number(button.dataset.downloadId);
  const payslipTheme = button.dataset.theme || elements.payslipTheme.value;
  try {
    const employee = payrollSystem.getEmployeeById(employeeId);
    downloadPayslipPdf(employee, payslipTheme);
  } catch (error) {
    renderToast(error.message, "error");
  }
});

elements.searchName.addEventListener("input", (event) => {
  const query = event.target.value;
  const matches = payrollSystem.searchByName(query);
  renderSearchSuggestions(matches, query);
});

elements.searchSuggestions.addEventListener("click", (event) => {
  const suggestion = event.target.closest(".search-suggestion-item");
  if (!suggestion) {
    return;
  }

  elements.searchName.value = suggestion.dataset.name;
  hideSearchSuggestions();
  elements.searchForm.requestSubmit();
});

document.addEventListener("click", (event) => {
  if (
    event.target !== elements.searchName &&
    !elements.searchSuggestions.contains(event.target)
  ) {
    hideSearchSuggestions();
  }
});

if (elements.themeToggle) {
  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

if (elements.payslipTheme) {
  elements.payslipTheme.addEventListener("change", () => {
    localStorage.setItem(PAYSLIP_THEME_KEY, elements.payslipTheme.value);
  });
}

elements.chatToggle.addEventListener("click", () => {
  elements.chatWidget.classList.toggle("hidden");
});

elements.chatClose.addEventListener("click", () => {
  elements.chatWidget.classList.add("hidden");
});

elements.chatOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.chat;
    elements.chatResponse.textContent = chatResponses[key];
  });
});

initializeTheme();
initializePayslipTheme();
renderMetrics();
