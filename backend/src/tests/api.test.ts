import request from 'supertest';
import { app } from '../app';
import { TaskHealthService } from '../services/taskHealthService';
import { TaskRepository } from '../repositories/taskRepository';

describe('Task Tracker Backend API Tests', () => {
  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/health returns detailed health status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('task-tracker-api');
    expect(res.body.database).toBe('connected');
  });

  it('POST /api/v1/auth/login authenticates demo admin user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'eslam@tasktracker.io', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('eslam@tasktracker.io');
    expect(res.body.data.user.role_name).toBe('Super Admin');
  });

  it('GET /api/v1/tasks returns populated task list', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('task_code');
    expect(res.body.data[0]).toHaveProperty('health');
  });

  it('POST /api/v1/tasks creates a new task and validates required fields', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Conduct Automated Penetration Scan',
        priority_id: 'p4',
        estimated_effort_hours: 8,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task_code).toMatch(/^TASK-\d+$/);
    expect(res.body.data.title).toBe('Conduct Automated Penetration Scan');
  });

  it('POST /api/v1/tasks rejects task with invalid short title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'No',
        priority_id: 'p1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('Prevents circular dependencies', async () => {
    // Add dep: A -> B
    const step1 = await TaskRepository.addDependency('t-101', 't-104', 'finish_to_start');
    expect(step1.success).toBe(true);

    // Try adding reverse dep: B -> A
    const step2 = await TaskRepository.addDependency('t-104', 't-101', 'finish_to_start');
    expect(step2.success).toBe(false);
    expect(step2.message).toContain('Circular dependency');
  });

  it('Calculates smart task health accurately', () => {
    const mockTask: any = {
      title: 'Delayed Report',
      due_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days overdue
      status: { status_type: 'in_progress', name: 'In Progress' },
      progress_percentage: 20,
    };

    const health = TaskHealthService.evaluateTaskHealth(mockTask);
    expect(health.isOverdue).toBe(true);
    expect(health.health).toBe('Critical');
    expect(health.score).toBeLessThan(40);
  });
});
