/**
 * HotelPro Standalone Database Seed Script
 * For populating MongoDB Atlas or Local MongoDB with luxury test records.
 *
 * Usage:
 * MONGODB_URI=your_connection_string npx tsx server/src/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  UserModel,
  HotelModel,
  RoomCategoryModel,
  RoomModel,
  BookingModel,
  ReviewModel,
  HousekeepingTaskModel,
  ServiceRequestModel,
  AdminLogModel,
} from './models/index.js';
import {
  initialUsers,
  initialHotels,
  initialCategories,
  initialRooms,
  initialBookings,
  initialReviews,
  initialHousekeeping,
  initialServices,
  initialLogs,
} from './config/database.js';

dotenv.config();

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is required to run the seed script.');
    console.log('Example: MONGODB_URI="mongodb://localhost:27017/hotelpro" npx tsx server/src/seed.ts');
    process.exit(1);
  }

  console.log('Connecting to MongoDB database...');
  await mongoose.connect(uri);
  console.log('Connected successfully. Purging existing collections...');

  await Promise.all([
    UserModel.deleteMany({}),
    HotelModel.deleteMany({}),
    RoomCategoryModel.deleteMany({}),
    RoomModel.deleteMany({}),
    BookingModel.deleteMany({}),
    ReviewModel.deleteMany({}),
    HousekeepingTaskModel.deleteMany({}),
    ServiceRequestModel.deleteMany({}),
    AdminLogModel.deleteMany({}),
  ]);

  console.log('Inserting seed records...');
  await UserModel.insertMany(initialUsers);
  await HotelModel.insertMany(initialHotels);
  await RoomCategoryModel.insertMany(initialCategories);
  await RoomModel.insertMany(initialRooms);
  await BookingModel.insertMany(initialBookings);
  await ReviewModel.insertMany(initialReviews);
  await HousekeepingTaskModel.insertMany(initialHousekeeping);
  await ServiceRequestModel.insertMany(initialServices);
  await AdminLogModel.insertMany(initialLogs);

  console.log('Seed completed successfully!');
  console.log(`- Users: ${initialUsers.length} (Guest, Staff, Manager, Super Admin)`);
  console.log(`- Hotels: ${initialHotels.length}`);
  console.log(`- Room Categories: ${initialCategories.length}`);
  console.log(`- Rooms: ${initialRooms.length}`);
  console.log(`- Bookings: ${initialBookings.length}`);
  console.log(`- Housekeeping Tasks: ${initialHousekeeping.length}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

runSeed().catch(err => {
  console.error('Seed script encountered an error:', err);
  process.exit(1);
});
