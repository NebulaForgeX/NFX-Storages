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
