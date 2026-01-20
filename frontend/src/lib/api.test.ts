import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from './api'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('proposeWeeklyPlan calls fetch with correct path', async () => {
    const mockData = { week_start_date: '2023-01-01', goal: 'Test', workouts: [] }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await api.proposeWeeklyPlan()
    expect(fetch).toHaveBeenCalledWith('/plan/propose', expect.any(Object))
    expect(result).toEqual(mockData)
  })

  it('handles fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response)

    await expect(api.proposeWeeklyPlan()).rejects.toThrow('Internal Server Error')
  })
})
