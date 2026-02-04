const EQUAL_THRESHOLD = 30 // centipawns -- within this range, moves are "roughly equal"

export class StockfishService {
  private worker: Worker | null = null
  private messageQueue: Array<(line: string) => void> = []

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('/stockfish.js', import.meta.url), {
          type: 'classic',
        })
        this.worker.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === 'string' ? e.data : ''
          if (line === 'uciok') {
            resolve()
          }
          for (const listener of this.messageQueue) {
            listener(line)
          }
        }
        this.worker.onerror = (e) => reject(e)
        this.worker.postMessage('uci')
      } catch (e) {
        reject(e)
      }
    })
  }

  async evaluate(fen: string, depth = 15): Promise<number> {
    if (!this.worker) throw new Error('Stockfish not initialized')

    return new Promise((resolve) => {
      const listener = (line: string) => {
        if (line.startsWith(`info depth ${depth} `) && line.includes(' score cp ')) {
          const match = line.match(/score cp (-?\d+)/)
          if (match) {
            this.messageQueue = this.messageQueue.filter((l) => l !== listener)
            this.worker!.postMessage('stop')
            resolve(parseInt(match[1]!, 10))
          }
        }
        // Handle mate scores
        if (line.startsWith(`info depth ${depth} `) && line.includes(' score mate ')) {
          const match = line.match(/score mate (-?\d+)/)
          if (match) {
            this.messageQueue = this.messageQueue.filter((l) => l !== listener)
            this.worker!.postMessage('stop')
            const mateIn = parseInt(match[1]!, 10)
            resolve(mateIn > 0 ? 10000 : -10000)
          }
        }
      }
      this.messageQueue.push(listener)
      this.worker!.postMessage(`position fen ${fen}`)
      this.worker!.postMessage(`go depth ${depth}`)
    })
  }

  formatEval(centipawns: number): string {
    const pawns = (centipawns / 100).toFixed(2)
    const sign = centipawns > 0 ? '+' : ''
    let assessment: string
    if (Math.abs(centipawns) <= EQUAL_THRESHOLD) {
      assessment = 'roughly equal'
    } else if (centipawns > 0) {
      assessment = 'White is better'
    } else {
      assessment = 'Black is better'
    }
    return `${sign}${pawns} pawns (${assessment})`
  }

  describeEvalDelta(bookEvalCp: number, userEvalCp: number): string {
    const delta = Math.abs(bookEvalCp - userEvalCp)
    if (delta <= EQUAL_THRESHOLD) {
      return 'Your move is roughly as good as the book move.'
    }
    const lost = (delta / 100).toFixed(2)
    return `Your move loses about ${lost} pawns of advantage.`
  }

  destroy(): void {
    this.worker?.terminate()
    this.worker = null
  }
}
