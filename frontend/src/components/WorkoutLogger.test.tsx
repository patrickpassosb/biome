import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkoutLogger } from './WorkoutLogger'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as api from '@/lib/api'

// Mock the API module
vi.mock('@/lib/api', () => ({
  logWorkout: vi.fn()
}))

describe('WorkoutLogger', () => {
  const defaultProps = {
    exerciseName: 'Bench Press',
    targetSets: 3,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with target sets', () => {
    render(<WorkoutLogger {...defaultProps} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    // 3 rows of inputs (kg, reps, rpe)
    expect(screen.getAllByPlaceholderText('kg')).toHaveLength(3)
  })

  it('allows adding a set', () => {
    render(<WorkoutLogger {...defaultProps} />)
    const addButton = screen.getByText(/Add Set/i)
    fireEvent.click(addButton)
    expect(screen.getAllByPlaceholderText('kg')).toHaveLength(4)
  })

  it('calls logWorkout and onClose on save', async () => {
    vi.mocked(api.logWorkout).mockResolvedValue({ status: 'success' })
    
    render(<WorkoutLogger {...defaultProps} />)
    
    const kgInputs = screen.getAllByPlaceholderText('kg')
    const repsInputs = screen.getAllByPlaceholderText('reps')
    
    // Fill first set
    fireEvent.change(kgInputs[0], { target: { value: '100' } })
    fireEvent.change(repsInputs[0], { target: { value: '10' } })
    
    const saveButton = screen.getByText(/Log Workout/i)
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(api.logWorkout).toHaveBeenCalledTimes(1)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('handles API errors', async () => {
    vi.mocked(api.logWorkout).mockRejectedValue(new Error('API Error'))
    vi.stubGlobal('alert', vi.fn()) // Mock alert

    render(<WorkoutLogger {...defaultProps} />)
    
    const kgInputs = screen.getAllByPlaceholderText('kg')
    const repsInputs = screen.getAllByPlaceholderText('reps')
    fireEvent.change(kgInputs[0], { target: { value: '100' } })
    fireEvent.change(repsInputs[0], { target: { value: '10' } })
    
    const saveButton = screen.getByText(/Log Workout/i)
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to save'))
    })
  })
})
