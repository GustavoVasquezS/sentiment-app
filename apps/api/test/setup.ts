import "dotenv/config";

process.env.NODE_ENV ??= "test";
process.env.JWT_SECRET ??= "test-secret-at-least-16-chars";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/sentiment_test";
