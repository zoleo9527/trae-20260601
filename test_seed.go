package main

import (
"fmt"
"scenic-ticket-system/internal/seed"
"scenic-ticket-system/internal/store"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("PANIC: %v\n", r)
		}
	}()
	fmt.Println("step 1: new store")
	s := store.NewStore()
	fmt.Println("step 2: seed")
	seed.Seed(s)
	fmt.Println("step 3: list bookings")
	bookings := s.ListBookings()
	fmt.Printf("  got %d bookings\n", len(bookings))
	fmt.Println("step 4: list notifications")
	notifs := s.ListAllNotifications()
	fmt.Printf("  got %d notifications\n", len(notifs))
	fmt.Println("done!")
}
