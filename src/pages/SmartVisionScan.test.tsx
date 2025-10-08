import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import SmartVisionScan from './SmartVisionScan'

// Mock the useAppStore hook
vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    addItem: vi.fn(),
    addActivity: vi.fn()
  })
}))

// Mock window.URL.createObjectURL and revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockImplementation(() => 'mock-url')
})

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
})

// Mock navigator.mediaDevices.getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockImplementation(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    }))
  }
})

describe('SmartVisionScan', () => {
  it('renders the component correctly', () => {
    render(<SmartVisionScan />)
    
    expect(screen.getByText('Smart Vision Scan')).toBeInTheDocument()
    expect(screen.getByText('Point your camera at a product to automatically recognize it')).toBeInTheDocument()
  })

  it('shows scan instructions', () => {
    render(<SmartVisionScan />)
    
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText('• Point your camera at a product')).toBeInTheDocument()
    expect(screen.getByText('• Tap "Scan Product" to capture and analyze')).toBeInTheDocument()
    expect(screen.getByText('• Our AI will identify the product')).toBeInTheDocument()
    expect(screen.getByText('• Confirm if the detection is correct to help improve accuracy')).toBeInTheDocument()
  })

  it('has scan product button', () => {
    render(<SmartVisionScan />)
    
    const scanButton = screen.getByRole('button', { name: /Scan Product/i })
    expect(scanButton).toBeInTheDocument()
    expect(scanButton).not.toBeDisabled()
  })

  it('has reset camera button', () => {
    render(<SmartVisionScan />)
    
    const resetButton = screen.getByRole('button', { name: /Reset Camera/i })
    expect(resetButton).toBeInTheDocument()
  })
})