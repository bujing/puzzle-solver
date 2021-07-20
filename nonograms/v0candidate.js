class Nonograms {
  numbers = [[], []]
  latest = [] // 盘面
  duration = 0 // 耗时
  #rows = 0
  #columns = 0
  #loop = false // 是否循环执行

  constructor (numbers) {
    this.numbers = numbers
    this.#rows = numbers[0].length
    this.#columns = numbers[1].length
    this.latest = Array(this.#rows).fill('').map(() => Array(this.#columns).fill('u'))

    this.duration = Date.now()
    this.solve()
    this.duration = Date.now() - this.duration
  }

  get solved () {
    return this.latest.flat().filter(v => v === 'u').length === 0
  }

  solve () {
    const rowCandidates = this.candidates(this.numbers[0], this.#columns)
    const columnCandidates = this.candidates(this.numbers[1], this.#rows)

    do {
      this.#loop = false

      rowCandidates.forEach((candidates, i) => {
        for (let j = 0; j < this.#columns; j++) {
          const val = Array.from(new Set(candidates.map(v => v[j])))
          if (val.length === 1) {
            this.latest[i][j] = val[0]
            this.#loop = true
          }
        }
      })
      columnCandidates.forEach((candidates, i) => {
        for (let j = 0; j < this.#rows; j++) {
          const val = Array.from(new Set(candidates.map(v => v[j])))
          if (val.length === 1) {
            this.latest[j][i] = val[0]
            this.#loop = true
          }
        }
      })

      rowCandidates.forEach((v, i) => {
        if (v.length === 1) {
          this.latest[i] = v[0]
          rowCandidates[i] = []
          this.#loop = true
        }
      })
      columnCandidates.forEach((v, i) => {
        if (v.length === 1) {
          v[0].forEach((v, j) => {
            this.latest[j][i] = v
          })
          columnCandidates[i] = []
          this.#loop = true
        }
      })

      if (this.#loop) {
        for (let i = 0; i < this.#rows; i++) {
          for (let j = 0; j < this.#columns; j++) {
            if (this.latest[i][j] !== 'u') {
              rowCandidates[i] = rowCandidates[i].filter(v => v[j] === this.latest[i][j])
              columnCandidates[j] = columnCandidates[j].filter(v => v[i] === this.latest[i][j])
            }
          }
        }
      }
    } while (this.#loop)
  }

  candidates (numbers, cellCount) {
    const allCandidates = []
    for (let i = 0; i < numbers.length; i++) {
      const possibles = this.possibles(numbers[i], cellCount) // 所有可能分布
      const candidates = []
      // 合并数字位，得到完整的可能分布
      for (let j = 0; j < possibles.length; j++) {
        const possible = possibles[j]
        candidates[j] = []
        for (let k = 0; k < possible.length; k++) {
          let l = possible[k]
          while (l) {
            candidates[j].push('x')
            l--
          }
          l = numbers[i][k]
          while (l) {
            candidates[j].push('o')
            l--
          }
        }
      }
      allCandidates.push(candidates)
    }
    return allCandidates
  }

  possibles (numbers, cellCount) {
    const fillCount = numbers.reduce((acc, cur) => acc + cur) // 提示数占单元格总数
    const emptyCount = cellCount - fillCount // 空白格总数
    const spaces = [[]].concat(numbers.map(() => [])) // 空白格可能的分布情况

    // 划定空白格上下限
    for (let i = 0; i < spaces.length; i++) {
      const side = i === 0 || i === spaces.length - 1
      for (let start = 0, end = emptyCount - (spaces.length - 2); start <= end; start++) {
        spaces[i].push(side ? start : start + 1)
      }
    }
    // 候选数
    const candidates = []
    // 遍历函数集
    const funs = [
      (...candidate) => candidates.push(candidate.map((v, i) => spaces[i][v]))
    ]
    let loop = 0
    while (loop < spaces.length) {
      let fun
      if (loop === 0) {
        fun = (...candidate) => {
          const k = emptyCount - candidate.map((v, i) => spaces[i][v]).reduce((acc, cur) => acc + cur)
          funs[0](...candidate, k)
        }
      } else {
        fun = (loop => (...candidate) => {
          const i = candidate.reduce((acc, cur) => acc + cur, 0)
          this.#foreach(0, spaces[loop].length - i, j => {
            funs[loop](...candidate, j)
          })
        })(loop)
      }
      funs.push(fun)
      loop++
    }
    funs[funs.length - 1]()
    return candidates
  }

  #foreach (start, end, fn) {
    for (let i = start; i < end; i++) {
      fn(i)
    }
  }
}