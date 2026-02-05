// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StockfishService } from '../stockfish'

describe('StockfishService', () => {
  it('formats evaluation as human-readable text', () => {
    const service = new StockfishService()
    expect(service.formatEval(150)).toBe('+1.50 pawns (White is better)')
    expect(service.formatEval(-80)).toBe('-0.80 pawns (Black is better)')
    expect(service.formatEval(15)).toBe('+0.15 pawns (roughly equal)')
    expect(service.formatEval(0)).toBe('0.00 pawns (roughly equal)')
  })

  it('calculates eval delta description', () => {
    const service = new StockfishService()
    expect(service.describeEvalDelta(50, -100)).toBe(
      'Your move loses about 1.50 pawns of advantage.'
    )
    expect(service.describeEvalDelta(50, 55)).toBe(
      'Your move is roughly as good as the book move.'
    )
  })
})

describe('StockfishService with mocked Worker', () => {
  let mockWorker: {
    postMessage: ReturnType<typeof vi.fn>
    terminate: ReturnType<typeof vi.fn>
    onmessage: ((e: MessageEvent) => void) | null
    onerror: ((e: ErrorEvent) => void) | null
  }

  beforeEach(() => {
    mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    }

    vi.stubGlobal('Worker', class {
      constructor() {
        Object.assign(this, mockWorker)
        // Wire up the onmessage/onerror setters to the mock
        return mockWorker as unknown as Worker
      }
    })
  })

  it('initializes by sending uci command and resolving on uciok', async () => {
    const service = new StockfishService()
    const initPromise = service.init()

    // Worker should have been created and sent 'uci'
    expect(mockWorker.postMessage).toHaveBeenCalledWith('uci')

    // Simulate stockfish responding with uciok
    mockWorker.onmessage!(new MessageEvent('message', { data: 'uciok' }))

    await expect(initPromise).resolves.toBeUndefined()
  })

  it('rejects init when Worker throws an error', async () => {
    const service = new StockfishService()
    const initPromise = service.init()

    mockWorker.onerror!(new ErrorEvent('error', { message: 'Worker failed' }))

    await expect(initPromise).rejects.toBeDefined()
  })

  it('evaluates a position and returns centipawn score', async () => {
    const service = new StockfishService()

    // Init first
    const initPromise = service.init()
    mockWorker.onmessage!(new MessageEvent('message', { data: 'uciok' }))
    await initPromise

    mockWorker.postMessage.mockClear()

    const evalPromise = service.evaluate('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 15)

    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      'position fen rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    )
    expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 15')

    // Simulate engine output at target depth
    mockWorker.onmessage!(new MessageEvent('message', {
      data: 'info depth 15 seldepth 20 score cp 35 nodes 50000 pv e5',
    }))

    const result = await evalPromise
    expect(result).toBe(35)
    expect(mockWorker.postMessage).toHaveBeenCalledWith('stop')
  })

  it('handles mate scores in evaluation', async () => {
    const service = new StockfishService()

    const initPromise = service.init()
    mockWorker.onmessage!(new MessageEvent('message', { data: 'uciok' }))
    await initPromise

    mockWorker.postMessage.mockClear()

    const evalPromise = service.evaluate('some-fen', 15)

    // Simulate mate score
    mockWorker.onmessage!(new MessageEvent('message', {
      data: 'info depth 15 seldepth 10 score mate 3 nodes 1000 pv Qh7',
    }))

    const result = await evalPromise
    expect(result).toBe(10000)
  })

  it('handles negative mate scores', async () => {
    const service = new StockfishService()

    const initPromise = service.init()
    mockWorker.onmessage!(new MessageEvent('message', { data: 'uciok' }))
    await initPromise

    mockWorker.postMessage.mockClear()

    const evalPromise = service.evaluate('some-fen', 15)

    mockWorker.onmessage!(new MessageEvent('message', {
      data: 'info depth 15 seldepth 10 score mate -2 nodes 1000 pv Kf1',
    }))

    const result = await evalPromise
    expect(result).toBe(-10000)
  })

  it('throws when evaluating without init', async () => {
    const service = new StockfishService()
    await expect(service.evaluate('some-fen')).rejects.toThrow('Stockfish not initialized')
  })

  it('terminates worker on destroy', async () => {
    const service = new StockfishService()

    const initPromise = service.init()
    mockWorker.onmessage!(new MessageEvent('message', { data: 'uciok' }))
    await initPromise

    service.destroy()
    expect(mockWorker.terminate).toHaveBeenCalled()
  })

  it('destroy is safe when no worker exists', () => {
    const service = new StockfishService()
    // Should not throw
    service.destroy()
  })
})
