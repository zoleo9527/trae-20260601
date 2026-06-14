.PHONY: build run test clean deps

# Build the application
build:
	go build -o bin/micro-loan cmd/main.go

# Run the application
run:
	go run cmd/main.go

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/
	go clean

# Download dependencies
deps:
	go mod download
	go mod tidy

# Install dependencies
install:
	go get -u github.com/gofiber/fiber/v2
	go get -u gorm.io/gorm
	go get -u gorm.io/driver/mysql
	go get -u github.com/google/uuid
