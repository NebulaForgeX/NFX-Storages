package transaction

import (
	"context"

	"gorm.io/gorm"
)

/**
 ** UoW (Unit of Work) encapsulates a database transaction.
 ** It provides access to the transactional database connection.
 ** UoW（工作单元）封装了一个数据库事务。
 ** 它提供对事务数据库连接的访问。
 *
 * Fields:
 *   !- DB: The transactional GORM database instance (事务性 GORM 数据库实例)
 *
 * Examples:
 *
 * 	// Using UoW in a transaction (在事务中使用 UoW)
 * 	txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// Use uow.DB for database operations
 * 		// All operations will be in the same transaction
 * 		return uow.DB.Create(&user).Error
 * 	})
 */
type UoW struct{ DB *gorm.DB }

/**
 ** TxManager manages database transactions using the Unit of Work pattern.
 ** It provides a consistent interface for executing operations within transactions.
 ** Automatically handles commit on success and rollback on error.
 ** TxManager 使用工作单元模式管理数据库事务。
 ** 它提供了在事务中执行操作的一致接口。
 ** 自动处理成功时提交和错误时回滚。
 *
 * Methods:
 *   !- WithUoW: Executes a function within a database transaction (在数据库事务中执行函数)
 *
 * Examples:
 *
 * 	// Initialize transaction manager (初始化事务管理器)
 * 	txManager := NewGormTxManager(db)
 *
 * 	// Example 1: Simple transaction (示例 1：简单事务)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// Create user
 * 		user := &User{Name: "Alice", Email: "alice@example.com"}
 * 		if err := uow.DB.Create(user).Error; err != nil {
 * 			return err // Rollback on error
 * 		}
 * 		// Create profile
 * 		profile := &Profile{UserID: user.ID, Bio: "Hello"}
 * 		return uow.DB.Create(profile).Error
 * 		// Auto-commit if no error, auto-rollback if error
 * 	})
 *
 * 	// Example 2: Multiple operations (示例 2：多个操作)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		// Deduct from account A
 * 		if err := uow.DB.Model(&Account{}).
 * 			Where("id = ?", accountA).
 * 			Update("balance", gorm.Expr("balance - ?", 100)).Error; err != nil {
 * 			return err
 * 		}
 *
 * 		// Add to account B
 * 		if err := uow.DB.Model(&Account{}).
 * 			Where("id = ?", accountB).
 * 			Update("balance", gorm.Expr("balance + ?", 100)).Error; err != nil {
 * 			return err
 * 		}
 *
 * 		return nil // Both operations committed together
 * 	})
 *
 * 	// Example 3: Using with repository pattern (示例 3：与仓库模式结合使用)
 * 	err := txManager.WithUoW(ctx, func(ctx context.Context, uow UoW) error {
 * 		userRepo := NewUserRepository(uow.DB)
 * 		orderRepo := NewOrderRepository(uow.DB)
 *
 * 		user, err := userRepo.Create(ctx, userData)
 * 		if err != nil {
 * 			return err
 * 		}
 *
 * 		order := &Order{UserID: user.ID, Amount: 100}
 * 		return orderRepo.Create(ctx, order)
 * 	})
 */
type TxManager interface {
	WithUoW(ctx context.Context, fn func(ctx context.Context, uow UoW) error) error
}
