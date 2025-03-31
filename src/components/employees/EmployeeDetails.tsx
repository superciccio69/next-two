import { Employee } from '@/types/employee';

interface EmployeeDetailsProps {
  employee: Employee;
  onClose: () => void;
}

export default function EmployeeDetails({ employee, onClose }: EmployeeDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium">{employee.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{employee.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Address</label>
                <p className="font-medium">{employee.address}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Employment Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Department</label>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium">{employee.role}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Hire Date</label>
                <p className="font-medium">{new Date(employee.hire_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className={`font-medium ${
                  employee.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Financial Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Base Salary</label>
                <p className="font-medium">€{employee.base_salary.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tax ID</label>
                <p className="font-medium">{employee.tax_id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Bank Account</label>
                <p className="font-medium">{employee.bank_account}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Contact Name</label>
                <p className="font-medium">{employee.emergency_contact}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Contact Phone</label>
                <p className="font-medium">{employee.emergency_phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}