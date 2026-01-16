import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from './api'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('getOverviewMetrics calls fetch with correct path', async () => {
    const mockData = { weekly_frequency: 3 }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await api.getOverviewMetrics()
    expect(fetch).toHaveBeenCalledWith('/metrics/overview', expect.any(Object))
    expect(result).toEqual(mockData)
  })

  it('logWorkout sends correct payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success' }),
    } as Response)

    const entry = {
        date: '2023-01-01',
        workout: 'Test',
        exercise: 'Bench',
        set_number: 1,
        reps: 10,
        weight_kg: 100,
        rpe: 8,
        notes: ''
    }
    await api.logWorkout(entry)
    
    expect(fetch).toHaveBeenCalledWith('/data/log', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(entry)
    }))
  })

  it('handles fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response)

    await expect(api.getOverviewMetrics()).rejects.toThrow('Internal Server Error')
  })
})
