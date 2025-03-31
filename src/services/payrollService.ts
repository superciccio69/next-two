interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  overtime: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
}

export const payrollService = {
  async getPayrollRecords(month: number, year: number): Promise<PayrollRecord[]> {
    const response = await fetch(`/api/payroll?month=${month}&year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch payroll records');
    }
    return response.json();
  },

  async processPayroll(month: number, year: number): Promise<PayrollRecord[]> {
    const response = await fetch('/api/payroll/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, year }),
    });
    if (!response.ok) {
      throw new Error('Failed to process payroll');
    }
    return response.json();
  },

  async updatePayrollStatus(id: number, status: PayrollRecord['status']): Promise<void> {
    const response = await fetch(`/api/payroll/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update payroll status');
    }
  },

  async downloadPayslip(id: number, employeeName: string, month: number, year: number): Promise<void> {
    const response = await fetch(`/api/payroll/${id}/payslip`);
    if (!response.ok) {
      throw new Error('Failed to generate payslip');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${employeeName}-${month}-${year}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  async getAnalytics(year: number) {
      const response = await fetch(`/api/payroll/analytics?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  
  // Add this method to your existing payrollService
  async processBulkPayroll(month: number, year: number, departments: string[]) {
    const response = await fetch('/api/payroll/bulk-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, year, departments }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to process bulk payroll');
    }
  
    return response.json();
  }
};