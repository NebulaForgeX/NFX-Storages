package fiberx

import "github.com/gofiber/fiber/v3"

func GetIP(c fiber.Ctx) string {
	if ip := c.Get("X-Forwarded-For"); ip != "" {
		return ip
	}
	return c.IP()
}

func GetUA(c fiber.Ctx) string {
	return c.Get("User-Agent")
}
