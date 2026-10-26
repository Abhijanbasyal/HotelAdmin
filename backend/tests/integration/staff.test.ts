import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { User } from '@/models/User.model';
import { Department } from '@/models/Department.model';

describe('Staff API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testDepartmentId: string;
  let receptionistRoleId: string;
  let testStaffId: string;

  beforeAll(async () => {
    await connectDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;

    // Create a test department
    const dept = await Department.create({
      name: 'StaffTest_Reception',
      code: 'STREC',
      status: 'active',
      isDeleted: false,
    });
    testDepartmentId = dept._id.toString();

    // Fetch roles
    const rolesRes = await request(app)
      .get('/api/v1/staff/roles')
      .set('Authorization', `Bearer ${adminToken}`);

    const roles = rolesRes.body.data as Array<{ _id: string; name: string }>;
    const receptionistRole = roles.find((r) => r.name === 'Receptionist') || roles[0];
    receptionistRoleId = receptionistRole._id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /^stafftest_/ } });
    await Department.deleteMany({ name: { $regex: /^StaffTest_/ } });
    await disconnectDatabase();
  });

  it('creates a staff member with role and department assignments', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'StaffTest_Alice Smith',
        email: 'stafftest_alice@hoteladmin.com',
        password: 'Password@123456',
        role: receptionistRoleId,
        department: testDepartmentId,
        phone: '+1-555-0222',
        jobTitle: 'Front Desk Lead',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('StaffTest_Alice Smith');
    expect(res.body.data.email).toBe('stafftest_alice@hoteladmin.com');
    expect(res.body.data.role.name).toBeDefined();
    expect(res.body.data.department.name).toBe('StaffTest_Reception');
    expect(res.body.data.password).toBeUndefined(); // ensure password hash not returned

    testStaffId = res.body.data._id as string;
  });

  it('rejects duplicate email for staff', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'StaffTest_Another User',
        email: 'stafftest_alice@hoteladmin.com',
        password: 'Password@123456',
        role: receptionistRoleId,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('lists staff with pagination, populated relations, and search filter', async () => {
    const res = await request(app)
      .get('/api/v1/staff?search=Alice')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].role).toBeDefined();
  });

  it('retrieves single staff member by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('StaffTest_Alice Smith');
    expect(res.body.data.jobTitle).toBe('Front Desk Lead');
  });

  it('updates staff details', async () => {
    const res = await request(app)
      .patch(`/api/v1/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        jobTitle: 'Senior Front Desk Lead',
        phone: '+1-555-0333',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.jobTitle).toBe('Senior Front Desk Lead');
    expect(res.body.data.phone).toBe('+1-555-0333');
  });

  it('soft-deletes staff member', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  it('restores soft-deleted staff member', async () => {
    const restoreRes = await request(app)
      .patch(`/api/v1/staff/${testStaffId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);

    const getRes = await request(app)
      .get(`/api/v1/staff/${testStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('StaffTest_Alice Smith');
  });
});
