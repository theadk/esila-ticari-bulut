-- Esila Ticari Yönetim Sistemi - MySQL Veritabanı Şeması

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Kullanıcı') DEFAULT 'Kullanıcı',
    status ENUM('Aktif', 'Pasif') DEFAULT 'Aktif'
);

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    companyName VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    taxOffice VARCHAR(255),
    taxNumber VARCHAR(255),
    companyLogo TEXT,
    smtp_host VARCHAR(255),
    smtp_port VARCHAR(50),
    smtp_user VARCHAR(255),
    smtp_pass VARCHAR(255),
    sms_token VARCHAR(255),
    sms_sender_id VARCHAR(100),
    printer_header_text TEXT,
    printer_footer_text TEXT,
    prefix_customer VARCHAR(50),
    next_customer_id INT,
    prefix_order VARCHAR(50),
    next_order_id INT,
    prefix_offer VARCHAR(50),
    next_offer_id INT,
    prefix_product VARCHAR(50),
    next_product_id INT,
    prefix_personnel VARCHAR(50),
    next_personnel_id INT
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    address TEXT,
    capacity INTEGER
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    sub_categories JSON
);

CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255),
    name VARCHAR(255),
    price DECIMAL(15,2),
    purchasePrice DECIMAL(15,2),
    stock INTEGER,
    category VARCHAR(255),
    warehouse VARCHAR(255),
    barcode VARCHAR(255),
    description TEXT,
    brand VARCHAR(255),
    taxRate DECIMAL(5,2),
    warehouseStocks JSON
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    type ENUM('Bireysel', 'Kurumsal'),
    name VARCHAR(255),
    companyName VARCHAR(255),
    taxOffice VARCHAR(255),
    taxNumber VARCHAR(255),
    tcNo VARCHAR(11),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    groupName VARCHAR(255),
    riskLimit DECIMAL(15,2)
);

CREATE TABLE IF NOT EXISTS customer_transactions (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255),
    date DATETIME,
    type ENUM('Satış', 'Tahsilat', 'İade', 'Ödeme', 'Devir'),
    amount DECIMAL(15,2),
    description TEXT,
    documentNo VARCHAR(255),
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cash_transactions (
    id VARCHAR(255) PRIMARY KEY,
    date DATETIME,
    type ENUM('Gelir', 'Gider'),
    amount DECIMAL(15,2),
    category VARCHAR(255),
    description TEXT,
    documentNo VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    tcNo VARCHAR(11),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    position VARCHAR(255),
    department VARCHAR(255),
    startDate DATE,
    salary DECIMAL(15,2),
    status ENUM('Aktif', 'Ayrıldı', 'İzinde'),
    bankName VARCHAR(255),
    iban VARCHAR(50),
    emergencyContactName VARCHAR(255),
    emergencyContactPhone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS personnel_records (
    id VARCHAR(255) PRIMARY KEY,
    personnelId VARCHAR(255),
    date DATETIME,
    type ENUM('Maaş', 'Avans', 'Prim', 'Kesinti', 'Diğer'),
    description TEXT,
    amount DECIMAL(15,2),
    FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255),
    customerName VARCHAR(255),
    date DATETIME,
    status ENUM('Bekliyor', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal'),
    totalVolume DECIMAL(15,2),
    totalWeight DECIMAL(15,2),
    totalAmount DECIMAL(15,2),
    items JSON,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS proposals (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255),
    customerName VARCHAR(255),
    date DATE,
    validUntil DATE,
    subTotal DECIMAL(15,2),
    taxTotal DECIMAL(15,2),
    total DECIMAL(15,2),
    status ENUM('Taslak', 'Gönderildi', 'Kabul Edildi', 'Reddedildi'),
    items JSON,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reconciliations (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255),
    customerName VARCHAR(255),
    date DATETIME,
    balanceType ENUM('Alacaklı', 'Borçlu', 'Bakiye Yok'),
    balance DECIMAL(15,2),
    status ENUM('Bekliyor', 'Onaylandı', 'Reddedildi'),
    notes TEXT,
    emailSentAt DATETIME,
    respondedAt DATETIME,
    responseNotes TEXT,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

-- Örnek Veriler (Opsiyonel)
INSERT IGNORE INTO users (id, name, username, email, passwordHash, role, status)
VALUES ('admin-1', 'Sistem Yöneticisi', 'admin', 'admin@firma.com', 'admin123', 'Admin', 'Aktif');
