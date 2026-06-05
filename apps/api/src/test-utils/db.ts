import mongoose from 'mongoose';

const TEST_DB_URI = process.env.MONGODB_TEST_URI
  ?? 'mongodb://admin:changeme@localhost:27018/comfytag_test?authSource=admin';

export async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(TEST_DB_URI);
    } catch (error) {
      console.error('Failed to connect to test MongoDB at', TEST_DB_URI);
      console.error('Ensure docker-compose is running: docker-compose up -d mongo');
      throw error;
    }
  }
}

export async function disconnectTestDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting from test DB:', error);
    throw error;
  }
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(col => col.deleteMany({}))
  );
}
