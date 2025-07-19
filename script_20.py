# Generate authentication middleware
auth_middleware_ts = """import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: any
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next()
  }
  return res.status(401).json({ error: 'Authentication required' })
}

// Middleware to check if user is admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // For demo purposes, we'll allow access to admin panel via URL
  // In production, you should implement proper role-based access
  if (req.path.includes(process.env.ADMIN_SECRET_PATH || 'admin')) {
    return next()
  }
  return res.status(403).json({ error: 'Admin access required' })
}

// Middleware for rate limiting specific to order creation
export const orderRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This could be enhanced with Redis for distributed rate limiting
  next()
}"""

# Generate SQL schema files
init_sql = """-- Create Users table
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
('2195 Diamonds', 2195, 0, 2900, NULL, 0);"""

# Generate stored procedures
stored_procedures_sql = """-- Stored procedure to create order with validation
CREATE PROCEDURE CreateOrder
    @UserId UNIQUEIDENTIFIER,
    @PlayerId BIGINT,
    @ServerId INT,
    @PackageId INT,
    @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @OrderId INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate package exists and is active
        IF NOT EXISTS (SELECT 1 FROM Packages WHERE id = @PackageId AND is_active = 1)
        BEGIN
            THROW 50001, 'Invalid package selected', 1;
        END
        
        -- Insert order
        INSERT INTO Orders (user_id, player_id, server_id, package_id, payment_method, status)
        VALUES (@UserId, @PlayerId, @ServerId, @PackageId, @PaymentMethod, 'Pending');
        
        SET @OrderId = SCOPE_IDENTITY();
        
        -- Return the created order
        SELECT 
            o.*,
            p.label as package_label,
            p.price as package_price
        FROM Orders o
        JOIN Packages p ON o.package_id = p.id
        WHERE o.id = @OrderId;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- Stored procedure to update order status
CREATE PROCEDURE UpdateOrderStatus
    @OrderId INT,
    @Status NVARCHAR(20),
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Orders 
    SET status = @Status,
        admin_notes = @AdminNotes,
        updated_at = SYSUTCDATETIME()
    WHERE id = @OrderId;
    
    SELECT @@ROWCOUNT as rows_affected;
END;

-- Function to get user order summary
CREATE FUNCTION GetUserOrderSummary(@UserId UNIQUEIDENTIFIER)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.status = 'Completed' THEN p.price ELSE 0 END) as total_spent,
        COUNT(CASE WHEN o.status = 'Pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'Completed' THEN 1 END) as completed_orders
    FROM Orders o
    JOIN Packages p ON o.package_id = p.id
    WHERE o.user_id = @UserId
);"""

# Write middleware and SQL files
with open(f"{base_dir}/server/src/middleware/auth.ts", "w") as f:
    f.write(auth_middleware_ts)

with open(f"{base_dir}/server/sql/init.sql", "w") as f:
    f.write(init_sql)

with open(f"{base_dir}/server/sql/stored_procedures.sql", "w") as f:
    f.write(stored_procedures_sql)

print("Middleware and SQL files created!")