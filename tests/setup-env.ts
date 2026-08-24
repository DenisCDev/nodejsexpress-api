process.env.JWT_SECRET ??= 'test-secret-must-be-at-least-32-chars-long';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.MONGODB_URI ??= 'mongodb://placeholder/replaced-by-globalSetup';
