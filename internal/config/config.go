package config

import (
	"os"
)

var (
	Port   string
	DBPath string
)

func Load() {
	Port = getEnv("PORT", "3000")
	DBPath = getEnv("DB_PATH", "./database/museum.db")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
