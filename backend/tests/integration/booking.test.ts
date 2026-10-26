import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Booking } from '@/models/Booking.model';
import { Table } from '@/models/Table.model';
import { Customer } from '@/models/Customer.model';

describe('Booking API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testCustomerId: string;
  let testTableId: string;
  let testBookingId: string;
  let secondBookingId: string;

  beforeAll(async () => {
    await connectDatabase();
    await Booking.deleteMany({ bookingNumber: { $regex: /^BKG-/ } });
    await Table.deleteMany({ tableNumber: { $regex: /^BookingTest_/i } });
    await Customer.deleteMany({ name: { $regex: /^BookingTest_/i } });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;

    // Create test customer
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'BookingTest_Alice Smith',
        phone: '+1-555-8822',
        email: 'alice.bookingtest@example.com',
      });
    testCustomerId = custRes.body.data._id as string;

    // Create test table
    const tableRes = await request(app)
      .post('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableNumber: 'BookingTest_T200',
        capacity: 4,
        location: 'indoor',
        status: 'available',
      });
    testTableId = tableRes.body.data._id as string;
  });

  afterAll(async () => {
    await Booking.deleteMany({ bookingNumber: { $regex: /^BKG-/ } });
    await Table.deleteMany({ tableNumber: { $regex: /^BookingTest_/i } });
    await Customer.deleteMany({ name: { $regex: /^BookingTest_/i } });
    await disconnectDatabase();
  });

  it('creates a new booking with valid time slot', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: testCustomerId,
        table: testTableId,
        guestCount: 2,
        bookingDate: '2026-11-15',
        startTime: '18:00',
        endTime: '20:00',
        specialRequests: 'Anniversary celebration, window view',
        status: 'confirmed',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingNumber).toBeDefined();
    expect(res.body.data.startTime).toBe('18:00');
    expect(res.body.data.endTime).toBe('20:00');
    expect(res.body.data.customer._id).toBe(testCustomerId);
    expect(res.body.data.table._id).toBe(testTableId);

    testBookingId = res.body.data._id as string;
  });

  it('rejects an overlapping booking on the same table (conflict detection)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: testCustomerId,
        table: testTableId,
        guestCount: 2,
        bookingDate: '2026-11-15',
        startTime: '19:00',
        endTime: '21:00',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already reserved');
  });

  it('allows a non-overlapping booking immediately following the previous one', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: testCustomerId,
        table: testTableId,
        guestCount: 4,
        bookingDate: '2026-11-15',
        startTime: '20:00',
        endTime: '22:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    secondBookingId = res.body.data._id as string;
  });

  it('rejects booking if guestCount exceeds table capacity', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: testCustomerId,
        table: testTableId,
        guestCount: 10,
        bookingDate: '2026-11-16',
        startTime: '18:00',
        endTime: '20:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('maximum capacity of 4');
  });

  it('lists bookings with date query and pagination', async () => {
    const res = await request(app)
      .get('/api/v1/bookings?date=2026-11-15')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('synchronizes table status when booking status changes to seated and completed', async () => {
    // 1. Transition booking to seated
    const seatRes = await request(app)
      .patch(`/api/v1/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'seated' });

    expect(seatRes.status).toBe(200);
    expect(seatRes.body.data.status).toBe('seated');

    // Verify table is now occupied
    const tableRes1 = await request(app)
      .get(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(tableRes1.body.data.status).toBe('occupied');

    // 2. Transition booking to completed
    const completeRes = await request(app)
      .patch(`/api/v1/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('completed');

    // Verify table returned to available
    const tableRes2 = await request(app)
      .get(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(tableRes2.body.data.status).toBe('available');
  });

  it('soft deletes and restores booking', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/bookings/${secondBookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/bookings/${secondBookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);

    const restoreRes = await request(app)
      .patch(`/api/v1/bookings/${secondBookingId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.success).toBe(true);
  });
});
