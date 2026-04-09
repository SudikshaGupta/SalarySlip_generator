#include <iostream>
#include <vector>
using namespace std;

class Employee {
private:
    int empID;
    string name;
    double basicPay;
    double otHours;

public:
    Employee() {}

    Employee(int id, string n, double basic, double ot) {
        empID = id;
        name = n;

        if (basic >= 0)
            basicPay = basic;
        else
            basicPay = 0;

        if (ot >= 0)
            otHours = ot;
        else
            otHours = 0;
    }

    int getID() { return empID; }
    string getName() { return name; }
    double getBasic() { return basicPay; }
    double getOT() { return otHours; }

    void updateOT(double ot) {
        if (ot >= 0)
            otHours = ot;
        else
            cout << "Invalid OT value\n";
    }

    double calculateGross() {
        double otRate = 200;
        return basicPay + (otHours * otRate);
    }

    double calculateTax(double gross) {
        if (gross <= 30000)
            return 0;
        else if (gross <= 60000)
            return gross * 0.1;
        else
            return gross * 0.2;
    }

    double calculateNet() {
        double gross = calculateGross();
        double tax = calculateTax(gross);
        return gross - tax;
    }

    void displayPayslip() {
        double gross = calculateGross();
        double tax = calculateTax(gross);
        double net = calculateNet();

        cout << "\nEmployee ID: " << empID << endl;
        cout << "Name: " << name << endl;
        cout << "Basic Pay: " << basicPay << endl;
        cout << "OT Hours: " << otHours << endl;
        cout << "Gross Salary: " << gross << endl;
        cout << "Tax: " << tax << endl;
        cout << "Net Salary: " << net << endl;
    }
};

class PayrollSystem {
private:
    vector<Employee> employees;

    int findEmployeeIndex(int id) {
        for (int i = 0; i < employees.size(); i++) {
            if (employees[i].getID() == id)
                return i;
        }
        return -1;
    }

public:
    void addEmployee() {
        int id;
        string name;
        double basic, ot;

        cout << "Enter Employee ID: ";
        cin >> id;

        if (findEmployeeIndex(id) != -1) {
            cout << "Employee ID already exists\n";
            return;
        }

        cout << "Enter Name: ";
        cin >> name;

        cout << "Enter Basic Pay: ";
        cin >> basic;

        cout << "Enter OT Hours: ";
        cin >> ot;

        if (basic < 0 || ot < 0) {
            cout << "Invalid input. Values must be non-negative\n";
            return;
        }

        Employee e(id, name, basic, ot);
        employees.push_back(e);

        cout << "Employee added successfully\n";
    }

    void updateOT() {
        int id;
        double ot;

        cout << "Enter Employee ID: ";
        cin >> id;

        int index = findEmployeeIndex(id);

        if (index == -1) {
            cout << "Employee not found\n";
            return;
        }

        cout << "Enter new OT Hours: ";
        cin >> ot;

        employees[index].updateOT(ot);
    }

    void generatePayslip() {
        int id;

        cout << "Enter Employee ID: ";
        cin >> id;

        int index = findEmployeeIndex(id);

        if (index == -1) {
            cout << "Employee not found\n";
            return;
        }

        employees[index].displayPayslip();
    }

    void totalPayout() {
        double total = 0;

        for (int i = 0; i < employees.size(); i++) {
            total = total + employees[i].calculateNet();
        }

        cout << "Total Salary Payout: " << total << endl;
    }

    void highestPaid() {
        if (employees.size() == 0) {
            cout << "No employees available\n";
            return;
        }

        int bestIndex = 0;

        for (int i = 1; i < employees.size(); i++) {
            if (employees[i].calculateNet() >
                employees[bestIndex].calculateNet()) {
                bestIndex = i;
            }
        }

        cout << "Highest Paid Employee:\n";
        employees[bestIndex].displayPayslip();
    }

    void searchByName() {
        string searchName;
        bool found = false;

        cout << "Enter name to search: ";
        cin >> searchName;

        for (int i = 0; i < employees.size(); i++) {
            if (employees[i].getName() == searchName) {
                employees[i].displayPayslip();
                found = true;
            }
        }

        if (found == false)
            cout << "No employee found\n";
    }

    void deleteEmployee() {
        int id;

        cout << "Enter Employee ID to delete: ";
        cin >> id;

        int index = findEmployeeIndex(id);

        if (index == -1) {
            cout << "Employee not found\n";
            return;
        }

        employees.erase(employees.begin() + index);
        cout << "Employee deleted successfully\n";
    }

    void displayAll() {
        if (employees.size() == 0) {
            cout << "No employee records\n";
            return;
        }

        for (int i = 0; i < employees.size(); i++) {
            employees[i].displayPayslip();
        }
    }
};

int main() {
    PayrollSystem system;
    int choice;

    do {
        cout << "\nEMPLOYEE PAYROLL SYSTEM\n";
        cout << "1. Add Employee\n";
        cout << "2. Update Overtime\n";
        cout << "3. Generate Payslip\n";
        cout << "4. Total Salary Payout\n";
        cout << "5. Highest Paid Employee\n";
        cout << "6. Search by Name\n";
        cout << "7. Delete Employee\n";
        cout << "8. Display All Employees\n";
        cout << "9. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch (choice) {
        case 1: system.addEmployee(); break;
        case 2: system.updateOT(); break;
        case 3: system.generatePayslip(); break;
        case 4: system.totalPayout(); break;
        case 5: system.highestPaid(); break;
        case 6: system.searchByName(); break;
        case 7: system.deleteEmployee(); break;
        case 8: system.displayAll(); break;
        case 9: cout << "Exiting\n"; break;
        default: cout << "Invalid choice\n";
        }

    } while (choice != 9);

    return 0;
}