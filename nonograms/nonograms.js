class Nonograms {
  numbers = [[], []]
  grid = [] // 盘面
  duration = 0 // 耗时
  #rows = 0
  #columns = 0
  #loop = false // 是否循环执行

  constructor (numbers) {
    this.numbers = numbers
    this.#rows = numbers[0].length
    this.#columns = numbers[1].length
    this.grid = Array(this.#rows).fill('').map(() => Array(this.#columns).fill(0))

    this.duration = Date.now()
    this.solve()
    this.duration = Date.now() - this.duration    
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
            this.grid[i][j] = val[0]
            this.#loop = true
          }
        }
      })
      columnCandidates.forEach((candidates, i) => {
        for (let j = 0; j < this.#rows; j++) {
          const val = Array.from(new Set(candidates.map(v => v[j])))
          if (val.length === 1) {
            this.grid[j][i] = val[0]
            this.#loop = true
          }
        }
      })

      rowCandidates.forEach((v, i) => {
        if (v.length === 1) {
          this.grid[i] = v[0]
          rowCandidates[i] = []
          this.#loop = true
        }
      })
      columnCandidates.forEach((v, i) => {
        if (v.length === 1) {
          v[0].forEach((v, j) => {
            this.grid[j][i] = v
          })
          columnCandidates[i] = []
          this.#loop = true
        }
      })

      if (this.#loop) {
        for (let i = 0; i < this.#rows; i++) {
          for (let j = 0; j < this.#columns; j++) {
            if (this.grid[i][j]) {
              rowCandidates[i] = rowCandidates[i].filter(v => v[j] === this.grid[i][j])
              columnCandidates[j] = columnCandidates[j].filter(v => v[i] === this.grid[i][j])
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
            candidates[j].push(-1)
            l--
          }
          l = numbers[i][k]
          while (l) {
            candidates[j].push(1)
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
    // 候选集
    const candidates = []
    // 基数
    const cardinal = [1]
    for (let i = spaces.length - 1; i > 0; i--) {
      cardinal.unshift(cardinal[0] * spaces[i].length)
    }
    // 当前下标
    const current = Array(spaces.length).fill(0)
    // 遍历次数
    const count = spaces.reduce((acc, cur) => acc * cur.length, 1)
    for (let i = 0; i < count; i++) {
      if (i) {
        const plus = cardinal.map(v => i % v)
        current.forEach((v, j) => {
          if (plus[j] === 0) {
            current[j] = ++current[j] % spaces[j].length
          }
        })
      }
      const spaceNum = current.map((v, i) => spaces[i][v])
      if (spaceNum.reduce((acc, cur) => acc + cur) === emptyCount) {
        candidates.push(spaceNum)
      }
    }
    return candidates
  }
}