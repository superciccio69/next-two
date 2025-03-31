interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hireDate: Date;
}

class EmployeeService {
  async create(employeeData: Partial<Employee>): Promise<Employee> {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      throw new Error('Failed to create employee');
    }

    return response.json();
  }

  async update(id: number, employeeData: Partial<Employee>): Promise<Employee> {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      throw new Error('Failed to update employee');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }
  }

  async getAll(): Promise<Employee[]> {
    const response = await fetch('/api/employees');
    
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }

    return response.json();
  }

  async getById(id: number): Promise<Employee> {
    const response = await fetch(`/api/employees/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch employee');
    }

    return response.json();
  }
}

export const employeeService = new EmployeeService();