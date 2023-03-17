class Sudoku {
  base = [] // 初盘
  solution = [] // 终盘
  duration = 0 // 耗时
  errorMessage = '' // 错误信息
  #grid = [] // 盘面
  #step = [] // 解谜步骤
  #stepIndex = 0 // 步骤计数
  #loop = false // 是否循环执行
  #backtracking = false // 是否需要回溯
  #tryAndError = [] // 试数

  constructor (grid) {
    // 初盘
    this.base = grid
    // 盘面
    this.#grid.push(this.forEach(grid, v => v))
    // 检查盘面是否符合最小初盘标准
    if (this.valueCount < 17) {
      this.errorMessage = '盘面最少需要 17 个提示数'
      return
    }
    if (this.sameValue(grid)) {
      this.errorMessage = '盘面存在重复的提示数'
      return
    }
    // 计时开始
    this.duration = Date.now()
    // 求解
    this.solve()
    // 计时结束
    this.duration = Date.now() - this.duration
    // 终盘
    if (this.valueCount === 81) {
      this.solution = this.latest
    }
  }

  // 明数总数
  get valueCount () {
    return this.latest.flat().filter(value => value && !Array.isArray(value)).length
  }

  get baseValueCount () {
    return this.base.flat().filter(Boolean).length
  }

  // 更新解谜步骤
  set step ({ value, row, column, remark }) {
    this.#step[row * 9 + column] = { index: this.#stepIndex, value, remark }
  }

  // 最新盘面
  get latest () {
    return this.#grid[this.#grid.length - 1]
  }
  set latest (cell) {
    const [row, column, value] = cell
    const grid = this.forEach(this.latest, v => v)
    grid[row][column] = value
    this.#grid.push(this.candidates(grid))
  }

  // 重复数检查
  sameValue (grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!grid[r][c] || Array.isArray(grid[r][c])) {
          continue
        }
        const regions = [
          this.region(grid, r, -1),
          this.region(grid, -1, c),
          this.region(grid, r, c)
        ]
        const multi = regions.some(region => region.filter(v => v === grid[r][c]).length > 1)
        if (multi) {
          return true
        }
      }
    }
    return false
  }

  // 求解
  solve () {
    while (this.valueCount < 81) {
      do {
        const newGrid = this.singleCandidates()
        if (newGrid) {
          this.#grid.push(newGrid)
        }
      } while (this.#loop)
      this.#stepIndex = this.valueCount - this.baseValueCount

      if (this.valueCount < 81) {
        if (this.#backtracking) {
          let last = this.#tryAndError.length - 1
          while (last > -1) {
            const { value, row, column, index, grid } = this.#tryAndError[last]
            if (index === value.length - 1) {
              last--
            } else {
              this.#tryAndError[last].index++
              this.#grid.length = grid
              const newGrid = this.forEach(this.#grid[grid - 1], v => v)
              newGrid[row][column] = value[index + 1]
              this.#grid.push(newGrid)
              this.#stepIndex = this.valueCount - this.baseValueCount
              this.step = { row, column, value: value[index + 1], remark: "回溯" }
              break
            }
          }
          if (last === -1) {
            this.errorMessage = '这不是一个标准的数独盘面'
            break
          }
        } else {
          const multivalueCell = this.multivalueCell(this.latest)
          const { value, row, column } = multivalueCell[0]
          this.#tryAndError.push({
            grid: this.#grid.length - 1,
            index: 0,
            value,
            row,
            column
          })
          const newGrid = this.forEach(this.latest, v => v)
          newGrid[row][column] = value[0]
          this.#grid.push(newGrid)
          this.#stepIndex = this.valueCount - this.baseValueCount
          this.step = { row, column, value: value[0], remark: "试数" }
        }
      }
    }
  }

  // 唯一候选数
  singleCandidates () {
    // 重置循环执行标记，避免无法正确跳出循环
    this.#loop = false
    // 重置回溯标记，避免错误回溯
    this.#backtracking = false
    // 更新候选数
    const newGrid = this.candidates(this.latest)
    // 检查是否存在空候选数单元格
    const hasEmptyCell = newGrid.flat().filter(v => Array.isArray(v) && v.length === 0).length > 0
    if (hasEmptyCell) {
      this.#backtracking = true
      return
    }
    // 遍历数独，检查各单元格是否存在唯一候选数
    const singleGrid = this.forEach(newGrid, (value, row, column) => {
      if (!Array.isArray(value)) {
        return value
      }
      // 获取单元格在不同区域（宫、行或列）的候选数
      const candidates = [
        this.region(newGrid, row, -1).flat(),
        this.region(newGrid, -1, column).flat(),
        this.region(newGrid, row, column).flat()
      ]
      // 只要任一候选数在任一区域内唯一，则此候选数就是其单元格的真数
      for (let i = 0; i < value.length; i++) {
        if (candidates.some(candidate => candidate.filter(v => v === value[i]).length === 1)) {
          this.#loop = true
          value = value[i]
          this.#stepIndex++
          this.step = { row, column, value, remark: "唯一" }
          break
        }
      }
      return value
    })
    const hasSameValue = this.sameValue(singleGrid)
    if (hasSameValue) {
      this.#loop = false
      this.#backtracking = true
      return
    }
    return singleGrid
  }

  // 遍历数独
  forEach (grid, fn) {
    const newGrid = []
    for (let r = 0; r < 9; r++) {
      newGrid[r] = []
      for (let c = 0; c < 9; c++) {
        newGrid[r][c] = fn(grid[r][c], r, c)
      }
    }
    return newGrid
  }

  /**
   * 区域
   * 宫、行和列的统称
   */
  region (grid, row, column) {
    if (row === -1) {
      return grid.map(rows => rows[column])
    } else if (column === -1) {
      return grid[row]
    } else {
      row = Math.floor(row / 3) * 3 // 大行 * 3
      column = Math.floor(column / 3) * 3 // 大列 * 3
      let box = []
      for (let i = 0; i < 3; i++) {
        box = box.concat(grid[row + i].slice(column, column + 3))
      }
      return box
    }
  }

  /**
   * 等位群格位
   * 单元格所在的行、列、宫内的其余 20 个单元格的总称
   */
  peer (grid, row, column) {
    return [
      ...this.region(grid, row, -1),
      ...this.region(grid, -1, column),
      ...this.region(grid, row, column)
    ]
  }

  /**
   * 候选数
   * 删减等位群格位中已出现的数字，将剩余可填数字填入单元格
   */
  candidates (grid) {
    return this.forEach(grid, (value, row, column) => {
      if (value && typeof value === 'number') {
        return value
      }
      const clues = Array.from(new Set(this.peer(grid, row, column).filter(v => v && !Array.isArray(v))))
      const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(v => clues.indexOf(v) === -1)
      if (candidates.length === 1) {
        this.#stepIndex++
        this.step = { row, column, value: candidates[0], remark: "候选" }
      }
      return candidates.length === 1 ? candidates[0] : candidates
    })
  }

  /**
   * 多值格
   * 单元格内存在多个候选数
   */
  multivalueCell (grid) {
    const multi = []
    for (let row = 0; row < 9; row++) {
      for (let column = 0; column < 9; column++) {
        const value = grid[row][column]
        if (Array.isArray(value)) {
          multi.push({
            value,
            row,
            column
          })
        }
      }
    }
    return multi.sort((a, b) => a.value.length - b.value.length || a.row - b.row || a.column - b.column)
  }
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = Sudoku
}
