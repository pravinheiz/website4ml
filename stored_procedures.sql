-- Stored procedure to create order with validation
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
);