CREATE DATABASE IF NOT EXISTS employee_management;
USE employee_management;

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role ENUM('ADMIN', 'MANAGER', 'EMPLOYEE') DEFAULT 'EMPLOYEE',
  department VARCHAR(255),
  position VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  check_in DATETIME,
  check_out DATETIME,
  status ENUM('PRESENT', 'ABSENT', 'LATE') DEFAULT 'PRESENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE shifts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  start_time DATETIME,
  end_time DATETIME,
  status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payroll (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  month INT,
  year INT,
  base_salary DECIMAL(10,2),
  overtime_hours DECIMAL(5,2),
  overtime_pay DECIMAL(10,2),
  deductions DECIMAL(10,2),
  net_salary DECIMAL(10,2),
  status ENUM('PENDING', 'PROCESSED', 'PAID') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);