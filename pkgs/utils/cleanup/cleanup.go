package cleanup

import (
	"errors"
	"nfxstorages/pkgs/utils/ptr"
)

/**
 ** CleanupAll cleans up multiple resources by calling their Close() or Stop() methods.
 ** It handles three types of cleanup interfaces:
 **   1. Close() error - Collects errors and returns them joined
 **   2. Close() - Calls without error handling
 **   3. Stop() - Calls stop method
 ** Nil resources are safely skipped. All non-nil errors are aggregated and returned.
 ** CleanupAll 通过调用 Close() 或 Stop() 方法清理多个资源。
 ** 它处理三种类型的清理接口：
 **   1. Close() error - 收集错误并返回合并的错误
 **   2. Close() - 调用但不处理错误
 **   3. Stop() - 调用停止方法
 ** 安全地跳过 nil 资源。所有非 nil 错误都会被聚合并返回。
 *
 * Parameters:
 *   !- resources: Variable number of resources to cleanup (可变数量的要清理的资源)
 *
 * Returns:
 *   !- error: Aggregated errors from Close() calls, or nil if no errors (Close() 调用的聚合错误，无错误则返回 nil)
 *
 * Examples:
 *
 * 	// Example 1: Cleanup database and file connections (示例 1：清理数据库和文件连接)
 * 	db, _ := sql.Open("postgres", "...")
 * 	file, _ := os.Open("data.txt")
 * 	defer CleanupAll(db, file)
 * 	// Both db.Close() and file.Close() will be called
 *
 * 	// Example 2: With nil resources (示例 2：带 nil 资源)
 * 	var db *sql.DB // nil
 * 	file, _ := os.Open("data.txt")
 * 	err := CleanupAll(db, file) // db is skipped, only file.Close() is called
 *
 * 	// Example 3: Aggregated errors (示例 3：聚合错误)
 * 	err := CleanupAll(resource1, resource2, resource3)
 * 	if err != nil {
 * 		// err contains all errors joined together
 * 		fmt.Printf("Cleanup errors: %v\n", err)
 * 	}
 *
 * 	// Example 4: With Stop() method (示例 4：使用 Stop() 方法)
 * 	type Server struct{}
 * 	func (s *Server) Stop() { fmt.Println("Server stopped") }
 *
 * 	server := &Server{}
 * 	CleanupAll(server) // Calls server.Stop()
 *
 * 	// Example 5: Mixed cleanup types (示例 5：混合清理类型)
 * 	type Resource1 struct{}
 * 	func (r *Resource1) Close() error { return nil }
 *
 * 	type Resource2 struct{}
 * 	func (r *Resource2) Close() { fmt.Println("Closed") }
 *
 * 	type Resource3 struct{}
 * 	func (r *Resource3) Stop() { fmt.Println("Stopped") }
 *
 * 	r1 := &Resource1{}
 * 	r2 := &Resource2{}
 * 	r3 := &Resource3{}
 * 	err := CleanupAll(r1, r2, r3) // All cleanup methods called
 */
func CleanupAll(resources ...any) error {
	var aggErr error

	for _, r := range resources {
		if ptr.IsNil(r) {
			continue
		}

		switch v := r.(type) {
		// ======= Close() with error =======
		case interface{ Close() error }:
			if err := v.Close(); err != nil {
				aggErr = errors.Join(aggErr, err)
			}

		// ======= Close() without error =======
		case interface{ Close() }:
			v.Close()

		// ======= Stop() =======
		case interface{ Stop() }:
			v.Stop()

		default:
			// Ignored
		}
	}

	return aggErr
}
