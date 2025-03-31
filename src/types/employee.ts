export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  base_salary: number;
  status: 'active' | 'inactive';
  hire_date: string;
  address: string;
  tax_id: string;
  bank_account: string;
  emergency_contact: string;
  emergency_phone: string;
  created_at?: string;
  updated_at?: string;
}