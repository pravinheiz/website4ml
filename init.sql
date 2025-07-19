-- Create Users table
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    google_id NVARCHAR(50) UNIQUE,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    avatar NVARCHAR(500),
    password_hash NVARCHAR(255),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Create Packages table
CREATE TABLE Packages (
    id INT PRIMARY KEY IDENTITY(1,1),
    label NVARCHAR(100) NOT NULL,
    diamonds INT NOT NULL,
    bonus INT DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    is_popular BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Create Orders table
CREATE TABLE Orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id UNIQUEIDENTIFIER NOT NULL,
    player_id BIGINT NOT NULL,
    server_id INT NOT NULL,
    package_id INT NOT NULL,
    payment_method NVARCHAR(50),
    status NVARCHAR(20) DEFAULT 'Pending',
    admin_notes NVARCHAR(MAX),
    whatsapp_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),

    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (package_id) REFERENCES Packages(id)
);

-- Create indexes for better performance
CREATE INDEX IX_Orders_UserId ON Orders(user_id);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(created_at);
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_GoogleId ON Users(google_id);

-- Insert default diamond packages
INSERT INTO Packages (label, diamonds, bonus, price, old_price, is_popular) VALUES
('50+50 Diamonds', 50, 50, 80, 100, 0),
('150+150 Diamonds', 150, 150, 260, 320, 0),
('250+250 Diamonds', 250, 250, 370, 450, 0),
('500+500 Diamonds', 500, 500, 680, 800, 1),
('1000+1000 Diamonds', 1000, 1000, 1300, 1600, 0),
('2000+2000 Diamonds', 2000, 2000, 2500, 3200, 0),
('5000+5000 Diamonds', 5000, 5000, 6000, 8000, 0),
('Weekly Pass', 11, 0, 130, NULL, 0),
('2195 Diamonds', 2195, 0, 2900, NULL, 0);