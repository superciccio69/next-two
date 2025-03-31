import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Employee } from '@/types/employee';
import EmployeeList from '@/components/employees/EmployeeList';
import EmployeeForm from '@/components/employees/EmployeeForm';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  };

  const handleSave = async () => {
    await fetchEmployees();
    handleCloseForm();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Employees</h1>
          <button
            onClick={handleAddEmployee}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Employee
          </button>
        </div>

        <EmployeeList 
          employees={employees} 
          onEdit={handleEditEmployee} 
          onRefresh={fetchEmployees}
        />

        {isFormOpen && (
          <EmployeeForm
            employee={selectedEmployee}
            onClose={handleCloseForm}
            onSave={handleSave}
          />
        )}
      </div>
    </Layout>
  );
};

export default EmployeesPage;