/**
 * Example unit test file
 * Run tests with: pnpm test:unit
 */
import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with objects', () => {
    const user = { name: 'Test', role: 'admin' }
    expect(user).toHaveProperty('name')
    expect(user.role).toBe('admin')
  })

  it('should work with arrays', () => {
    const roles = ['owner', 'admin', 'editor', 'viewer']
    expect(roles).toContain('admin')
    expect(roles).toHaveLength(4)
  })
})
