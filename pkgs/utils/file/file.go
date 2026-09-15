package file

import "os"

/**
 ** Exists checks if a file exists at the given path and is not a directory.
 ** Returns false if the path doesn't exist, is a directory, or if there's an error accessing it.
 ** Exists 检查给定路径的文件是否存在且不是目录。
 ** 如果路径不存在、是目录或访问时出错，则返回 false。
 *
 * Parameters:
 *   !- path: The file path to check (要检查的文件路径)
 *
 * Returns:
 *   !- bool: true if file exists and is not a directory (文件存在且不是目录时返回 true)
 *
 * Examples:
 *
 * 	// Check if a file exists (检查文件是否存在)
 * 	exists := Exists("/path/to/file.txt")
 * 	if exists {
 * 		fmt.Println("File exists")
 * 	}
 *
 * 	// File doesn't exist (文件不存在)
 * 	exists := Exists("/path/to/nonexistent.txt")
 * 	// Returns: false
 *
 * 	// Path is a directory (路径是目录)
 * 	exists := Exists("/path/to/directory")
 * 	// Returns: false
 *
 * 	// Permission error or other error (权限错误或其他错误)
 * 	exists := Exists("/root/protected.txt")
 * 	// Returns: false (if permission denied)
 */
func Exists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
