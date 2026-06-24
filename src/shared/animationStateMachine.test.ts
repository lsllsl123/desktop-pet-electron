import { describe, it } from 'node:test'
import assert from 'node:assert'
import { canTransition, transition, stateLabel, PetState, TRANSITIONS } from './animationStateMachine'

void describe('animationStateMachine', () => {
  void describe('canTransition', () => {
    const cases: [PetState, PetState, boolean][] = [
      ['idle',        'clicked',     true],
      ['idle',        'exploding',   true],
      ['idle',        'dragging',    false],
      ['idle',        'dragRecover', false],
      ['idle',        'idle',        false],
      ['clicked',     'dragging',    true],
      ['clicked',     'idle',        true],
      ['clicked',     'exploding',   true],
      ['clicked',     'clicked',     false],
      ['clicked',     'dragRecover', false],
      ['dragging',    'dragRecover', true],
      ['dragging',    'exploding',   true],
      ['dragging',    'idle',        false],
      ['dragging',    'clicked',     false],
      ['dragRecover', 'idle',        true],
      ['dragRecover', 'exploding',   true],
      ['dragRecover', 'clicked',     false],
      ['dragRecover', 'dragging',    false],
      ['exploding',   'idle',        true],
      ['exploding',   'clicked',     false],
      ['exploding',   'dragging',    false],
      ['exploding',   'dragRecover', false],
    ]
    for (const [from, to, expected] of cases) {
      void it(`${from} → ${to} = ${expected}`, () => {
        assert.strictEqual(canTransition(from, to), expected)
      })
    }
  })

  void describe('transition', () => {
    void it('returns next state when valid', () => {
      assert.strictEqual(transition('idle', 'clicked'), 'clicked')
    })

    void it('returns current state when invalid', () => {
      assert.strictEqual(transition('idle', 'dragging'), 'idle')
    })

    void it('returns current state for unknown target', () => {
      assert.strictEqual(transition('idle', 'bogus' as PetState), 'idle')
    })

    void it('exploding can only transition to idle', () => {
      assert.strictEqual(transition('exploding', 'idle'), 'idle')
      assert.strictEqual(transition('exploding', 'clicked'), 'exploding')
      assert.strictEqual(transition('exploding', 'dragging'), 'exploding')
    })
  })

  void describe('stateLabel', () => {
    void it('returns a label for every defined state', () => {
      for (const s of Object.keys(TRANSITIONS) as PetState[]) {
        assert.ok(stateLabel(s).length > 0, `label for ${s} should be non-empty`)
      }
    })
  })
})
