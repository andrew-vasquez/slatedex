package cache

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var client *redis.Client

func Init() {
	// client = redis.NewClient(&redis.Options{
	// 	Addr: os.Getenv("REDIS_URL"),
	// })

	opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}
	client = redis.NewClient(opt)
}

func Get(key string) (string, error) {
	return client.Get(ctx, key).Result()
}
func Set(key string, value string) error {
	return client.Set(ctx, key, value, 24*time.Hour).Err()

}

func SetWithTTL(key string, value string, ttl time.Duration) error {
	return client.Set(ctx, key, value, ttl).Err()
}
