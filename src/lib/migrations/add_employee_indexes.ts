import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
});

export async function up() {
  // Execute each index creation separately
  await pool.query('CREATE INDEX idx_employee_department ON employees(department)');
  await pool.query('CREATE INDEX idx_employee_status ON employees(status)');
  await pool.query('CREATE INDEX idx_employee_hire_date ON employees(hire_date)');
}

export async function down() {
  // Execute each index drop separately
  await pool.query('DROP INDEX idx_employee_department ON employees');
  await pool.query('DROP INDEX idx_employee_status ON employees');
  await pool.query('DROP INDEX idx_employee_hire_date ON employees');
}