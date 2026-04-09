#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
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
        basicPay = (basic >= 0) ? basic : 0;
        otHours = (ot >= 0) ? ot : 0;
    }

    int getID() { return empID; }
    string getName() { return name; }
    double getBasic() { return basicPay; }
    double getOT() { return otHours; }

    void updateOT(double ot) {
        if (ot >= 0)
            otHours = ot;
    }

    double calculateGross() {
        return basicPay + (otHours * 200);
    }

    double calculateTax(double gross) {
        if (gross <= 30000) return 0;
        else if (gross <= 60000) return gross * 0.1;
        else return gross * 0.2;
    }

    double calculateNet() {
        double gross = calculateGross();
        return gross - calculateTax(gross);
    }

    string toFileString() {
        return to_string(empID) + "," + name + "," + to_string(basicPay) + "," + to_string(otHours);
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

    void saveToFile() {
        ofstream file("employees.txt");
        for (auto &e : employees) {
            file << e.toFileString() << endl;
        }
        file.close();
    }

    void loadFromFile() {
        ifstream file("employees.txt");
        if (!file) return;

        string line;
        while (getline(file, line)) {
            stringstream ss(line);
            string id, name, basic, ot;

            getline(ss, id, ',');
            getline(ss, name, ',');
            getline(ss, basic, ',');
            getline(ss, ot, ',');

            employees.push_back(Employee(stoi(id), name, stod(basic), stod(ot)));
        }
        file.close();
    }

public:
    PayrollSystem() {
        loadFromFile();
    }

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
            cout << "Invalid input\n";
            return;
        }

        employees.push_back(Employee(id, name, basic, ot));
        saveToFile();

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
        saveToFile();
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
        for (auto &e : employees) {
            total += e.calculateNet();
        }
        cout << "Total Salary Payout: " << total << endl;
    }

    void highestPaid() {
        if (employees.empty()) {
            cout << "No employees available\n";
            return;
        }

        int bestIndex = 0;
        for (int i = 1; i < employees.size(); i++) {
            if (employees[i].calculateNet() > employees[bestIndex].calculateNet()) {
                bestIndex = i;
            }
        }

        employees[bestIndex].displayPayslip();
    }

    void searchByName() {
        string name;
        bool found = false;

        cout << "Enter name: ";
        cin >> name;

        for (auto &e : employees) {
            if (e.getName() == name) {
                e.displayPayslip();
                found = true;
            }
        }

        if (!found) cout << "No employee found\n";
    }

    void deleteEmployee() {
        int id;

        cout << "Enter Employee ID: ";
        cin >> id;

        int index = findEmployeeIndex(id);
        if (index == -1) {
            cout << "Employee not found\n";
            return;
        }

        employees.erase(employees.begin() + index);
        saveToFile();

        cout << "Employee deleted\n";
    }

    void displayAll() {
        if (employees.empty()) {
            cout << "No records\n";
            return;
        }

        for (auto &e : employees) {
            e.displayPayslip();
        }
    }
};

int main() {
    PayrollSystem system;
    int choice;

    do {
        cout << "\n1 Add\n2 Update OT\n3 Payslip\n4 Total\n5 Highest\n6 Search\n7 Delete\n8 Display\n9 Exit\n";
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
        }
    } while (choice != 9);

    return 0;
}