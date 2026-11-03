// Runs before every test file (before app modules are imported).
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-chars';
