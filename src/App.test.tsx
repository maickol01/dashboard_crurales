import { render, screen } from '@testing-library/react'
import App from './App'

test('renders dashboard title', () => {
  render(<App />)
  const titleElement = screen.getByText(/Dashboard CRurales/i)
  expect(titleElement).toBeInTheDocument()
})

test('renders KPI cards', () => {
  render(<App />)
  const metricsTitle = screen.getByText(/Métricas Principales/i)
  expect(metricsTitle).toBeInTheDocument()
})
