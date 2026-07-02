import { POST } from '../app/api/ai/extract/route';
import { createClient } from '../utils/supabase/server';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

// Mock Supabase client
jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('AI Extract API - Pruebas Negativas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Suprimimos console.error en pruebas para no ensuciar la terminal
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('debería devolver 401 si el usuario no está autenticado', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not logged in') }) }
    });

    const request = {
      json: async () => ({ dialogue: 'Test' })
    };

    const response = await POST(request);
    expect(response.status).toBe(401);
    
    const json = await response.json();
    expect(json.error).toBe('No autorizado');
  });

  it('debería devolver 400 si la descripción (dialogue) está vacía', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }) }
    });

    const request = {
      json: async () => ({ dialogue: '   ' })
    };

    const response = await POST(request);
    expect(response.status).toBe(400);
    
    const json = await response.json();
    expect(json.error).toBe('La descripción no puede estar vacía.');
  });

  it('debería devolver 500 si la API de Huawei falla', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }) }
    });

    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn().mockResolvedValue('Service Unavailable')
    });

    const request = {
      json: async () => ({ dialogue: 'Proyecto de test' })
    };

    const response = await POST(request);
    expect(response.status).toBe(500);
    
    const json = await response.json();
    expect(json.error).toBe('Error al procesar el texto. Verifica que la IA generó un JSON válido.');
  });

  it('debería devolver 500 si la IA devuelve basura (no JSON)', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }) }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Hola, soy la IA y no te voy a dar un JSON, te voy a contar un chiste.' } }]
      })
    });

    const request = {
      json: async () => ({ dialogue: 'Proyecto de test' })
    };

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
