-- ========================================
-- COPIE E COLE NO MYSQL WORKBENCH OU PHPMYADMIN
-- ========================================

-- 1. Criar banco de dados
CREATE DATABASE IF NOT EXISTS face_mask_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Usar o banco
USE face_mask_auth;

-- 3. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  face_descriptor TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_name (user_name),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Criar tabela de logs
CREATE TABLE IF NOT EXISTS auth_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  auth_type ENUM('login', 'register') NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_name (user_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Verificar tabelas criadas
SHOW TABLES;

-- 6. Ver estrutura das tabelas
DESCRIBE users;
DESCRIBE auth_logs;

-- Pronto! Agora configure o arquivo backend/.env
