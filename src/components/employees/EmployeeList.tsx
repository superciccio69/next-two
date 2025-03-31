import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Employee } from '@/types/employee';
import { FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import EmployeeDetails from './EmployeeDetails';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onRefresh: () => Promise<void>;
}

export default function EmployeeList({ employees, onEdit, onRefresh }: EmployeeListProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const router = useRouter();
  const [deleteError, setDeleteError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete employee');
      
      onRefresh();
    } catch (error) {
      setDeleteError('Failed to delete employee');
      setTimeout(() => setDeleteError(''), 3000);
    }
  };

  // Filter employees based on search term
  useEffect(() => {
    const employeeArray = Array.isArray(employees) ? employees : [];
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employeeArray);
    } else {
      const filtered = employeeArray.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employees, searchTerm]);

  return (
    <div>
      {deleteError && (
        <div className="text-red-500 mb-4">{deleteError}</div>
      )}
      
      <div className="mb-4 flex items-center border border-gray-300 rounded-md px-3 py-2 shadow-sm">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search employees..."
          className="flex-grow outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto border rounded-md">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 relative">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{employee.base_salary}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(employee.hire_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => onEdit(employee)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <FaEdit className="inline-block w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push(`/employees/${employee.id}`)}
                  className="text-blue-600 hover:text-blue-900"
                >
                 </button>
                <button
            onClick={() => setSelectedEmployee(employee)}
             className="text-blue-600 hover:text-blue-900"
                                                          >
  <FaEye className="inline-block w-4 h-4" />
</button>




                <button
                  onClick={() => handleDelete(employee.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FaTrash className="inline-block w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
    </div>
  );
}