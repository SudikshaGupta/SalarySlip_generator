const STORAGE_KEY = "payroll-pro-employees";
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
      (employee) => employee.name.toLowerCase() === normalized
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

function createEmployeeCard(employee, title = "Employee Payslip") {
  const gross = employee.calculateGross();
  const tax = employee.calculateTax(gross);
  const net = employee.calculateNet();

  return `
    <article class="output-card">
      <h3>${title}</h3>
      <p class="output-meta">Employee ID: ${employee.empID} | Name: ${employee.name}</p>
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

function setOutput(html) {
  elements.output.innerHTML = html;
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
    setOutput(createEmployeeCard(employee, "New Employee Added"));
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
    setOutput(createEmployeeCard(employee, "Overtime Updated"));
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

  if (matches.length === 0) {
    showEmptyState("No employee found with that exact name.");
    renderToast("No employee found", "error");
    return;
  }

  setOutput(`
    <div class="employee-list">
      ${matches.map((employee) => createEmployeeCard(employee, "Search Result")).join("")}
    </div>
  `);
  elements.searchForm.reset();
  renderToast(`${matches.length} employee record(s) found`, "success");
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
    setOutput(createEmployeeCard(employee, "Generated Payslip"));
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
    setOutput(createEmployeeCard(employee, "Highest Paid Employee"));
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
      ${employees.map((employee) => createEmployeeCard(employee, "Employee Record")).join("")}
    </div>
  `);
  renderToast("Showing all employee records", "success");
});

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

renderMetrics();
