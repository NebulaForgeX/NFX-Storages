package transaction

import (
	"context"

	"gorm.io/gorm"
)

/**
 ** gormTxManager is a GORM-based implementation of the TxManager interface.
 ** It wraps GORM's transaction functionality to provide the Unit of Work pattern.
 ** gormTxManager 是 TxManager 接口的基于 GORM 的实现。
 ** 它包装了 GORM 的事务功能以提供工作单元模式。
 */
type gormTxManager struct {
	db *gorm.DB
}

/**
 ** NewGormTxManager creates a new GORM-based transaction manager.
 ** The transaction manager uses GORM's built-in transaction support.
 ** NewGormTxManager 创建一个新的基于 GORM 的事务管理器。
 ** 事务管理器使用 GORM 的内置事务支持。
 *
 * Parameters:
 *   !- db: GORM database instance (GORM 数据库实例)
 *
 * Returns:
 *   !- TxManager: Transaction manager interface (事务管理器接口)
 *
 * Examples:
 *
 * 	// Initialize database (初始化数据库)
 * 	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
 * 	if err != nil {
 * 		panic(err)
 * 	}
 *
 * 	// Create transaction manager (创建事务管理器)
 * 	txManager := NewGormTxManager(db)
 *
 * 	// Use in service layer (在服务层使用)
 * 	type UserService struct {
 * 		txManager TxManager
 * 	}
 *
 * 	func NewUserService(txManager TxManager) *UserService {
 * 		return &UserService{txManager: txManager}
 * 	}
 *
 * 	// Example: Create user with related data (示例：创建用户及关联数据)
 * 	func (s *UserService) CreateUserWithProfile(ctx context.Context, userData UserData) error {
 * 		return s.txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 			// Create user
 * 			user := &User{
 * 				Name:  userData.Name,
 * 				Email: userData.Email,
 * 			}
 * 			if err := uow.DB.Create(user).Error; err != nil {
 * 				return err
 * 			}
 *
 * 			// Create profile
 * 			profile := &Profile{
 * 				UserID: user.ID,
 * 				Bio:    userData.Bio,
 * 			}
 * 			return uow.DB.Create(profile).Error
 * 		})
 * 	}
 */
func NewGormTxManager(db *gorm.DB) TxManager {
	return &gormTxManager{db: db}
}

/**
 ** WithUoW executes a function within a database transaction.
 ** If the function returns an error, the transaction is rolled back.
 ** If the function succeeds, the transaction is committed.
 ** Panics are also caught and result in a rollback.
 ** WithUoW 在数据库事务中执行函数。
 ** 如果函数返回错误，事务会回滚。
 ** 如果函数成功，事务会提交。
 ** panic 也会被捕获并导致回滚。
 *
 * Parameters:
 *   !- ctx: Context for the transaction (事务的上下文)
 *   !- fn: Function to execute within transaction (在事务中执行的函数)
 *
 * Returns:
 *   !- error: Error from the function or transaction error (函数或事务的错误)
 *
 * Behavior:
 *   - Creates a new transaction
 *   - Executes the provided function with the transactional database
 *   - Commits on success (no error returned)
 *   - Rolls back on error or panic
 *   - Context is properly propagated
 *
 * Examples:
 *
 * 	// Example 1: Transfer money between accounts (示例 1：账户间转账)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// Deduct from sender
 * 		result := uow.DB.Model(&Account{}).
 * 			Where("id = ? AND balance >= ?", senderID, amount).
 * 			Update("balance", gorm.Expr("balance - ?", amount))
 * 		if result.Error != nil {
 * 			return result.Error
 * 		}
 * 		if result.RowsAffected == 0 {
 * 			return errors.New("insufficient balance")
 * 		}
 *
 * 		// Add to receiver
 * 		return uow.DB.Model(&Account{}).
 * 			Where("id = ?", receiverID).
 * 			Update("balance", gorm.Expr("balance + ?", amount)).Error
 * 	})
 * 	// Both updates committed together or rolled back together
 *
 * 	// Example 2: Create order with items (示例 2：创建订单及商品)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// Create order
 * 		order := &Order{
 * 			UserID:     userID,
 * 			TotalPrice: totalPrice,
 * 			Status:     "pending",
 * 		}
 * 		if err := uow.DB.Create(order).Error; err != nil {
 * 			return err
 * 		}
 *
 * 		// Create order items
 * 		for _, item := range items {
 * 			orderItem := &OrderItem{
 * 				OrderID:   order.ID,
 * 				ProductID: item.ProductID,
 * 				Quantity:  item.Quantity,
 * 				Price:     item.Price,
 * 			}
 * 			if err := uow.DB.Create(orderItem).Error; err != nil {
 * 				return err
 * 			}
 * 		}
 *
 * 		// Update product stock
 * 		for _, item := range items {
 * 			if err := uow.DB.Model(&Product{}).
 * 				Where("id = ?", item.ProductID).
 * 				Update("stock", gorm.Expr("stock - ?", item.Quantity)).Error; err != nil {
 * 				return err
 * 			}
 * 		}
 *
 * 		return nil
 * 	})
 *
 * 	// Example 3: Nested repository calls (示例 3：嵌套仓库调用)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// All repositories share the same transaction
 * 		userRepo := repository.NewUserRepository(uow.DB)
 * 		walletRepo := repository.NewWalletRepository(uow.DB)
 * 		auditRepo := repository.NewAuditRepository(uow.DB)
 *
 * 		// Create user
 * 		user, err := userRepo.Create(ctx, userData)
 * 		if err != nil {
 * 			return err
 * 		}
 *
 * 		// Create wallet for user
 * 		wallet := &Wallet{UserID: user.ID, Balance: 0}
 * 		if err := walletRepo.Create(ctx, wallet); err != nil {
 * 			return err
 * 		}
 *
 * 		// Log audit trail
 * 		audit := &Audit{
 * 			UserID: user.ID,
 * 			Action: "user_created",
 * 		}
 * 		return auditRepo.Create(ctx, audit)
 * 	})
 */
func (m *gormTxManager) WithUoW(ctx context.Context, fn func(ctx context.Context, uow UoW) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(ctx, UoW{DB: tx})
	})
}
