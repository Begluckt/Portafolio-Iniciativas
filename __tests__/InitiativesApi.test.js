import { POST } from '../app/api/initiatives/route';
import { createInitiative } from '../lib/db';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

jest.mock('../lib/db', () => ({
  createInitiative: jest.fn(),
  getInitiatives: jest.fn(),
}));

describe('Initiatives API POST - Pruebas de Estrés', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('debería devolver 500 si hay un error al crear en la Base de Datos (ej. Supabase caído)', async () => {
    createInitiative.mockRejectedValue(new Error('Connection timeout to Supabase'));

    const request = {
      json: async () => ({ ini_name: 'Proyecto Alpha' })
    };

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('Failed to create initiative');
  });
});
