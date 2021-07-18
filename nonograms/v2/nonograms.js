class Nonograms {
  numbers = [[], []]
  regexps = [[], []]
  duration = 0 // 耗时
  errorMessage = '' // 错误信息
  #grid = [] // 盘面
  #rows = 0
  #columns = 0
  #loopTime = 0
  #loop = true // 是否循环执行
  #backtracking = false // 是否需要回溯
  #tryAndError = [] // 试数

  constructor (numbers, time = -1, pause = false) {
    this.numbers = numbers
    this.#rows = numbers[0].length
    this.#columns = numbers[1].length

    const grid = Array(this.#rows).fill('').map(() => Array(this.#columns).fill('u'))
    this.toRegExp()
    this.duration = Date.now()
    this.oxTest(grid)
    this.latest = grid
    if (this.solved) {
      this.duration = Date.now() - this.duration
    } else {
      this.solve(time, pause)
    }
  }

  get latest () {
    return this.#grid[this.#grid.length - 1]
  }
  set latest (grid) {
    this.#grid.push(this.clone(grid))
  }

  get solved () {
    return this.latest.flat().filter(v => v === 'u').length === 0
  }

  solve (time, pause) {
    this.solveSync(time)
    if (!this.solved && time > 0 && !pause) {
      window.setTimeout(() => {
        this.solve(time)
      }, 0)
    }
  }

  solveSync (time) {
    while (this.#loop && time !== 0) {
      time--
      this.#loopTime++
      this.#loop = false

      if (this.#backtracking) {
        this.#backtracking = false

        let last = this.#tryAndError.length - 1
        while (last > -1) {
          const [index, row, column, value] = this.#tryAndError[last]
          if (value === 'x') {
            this.#tryAndError.length = last
            last--
          } else if (value === 'o') {
            this.#tryAndError[last][3] = 'x'
            this.#grid.length = index
            const grid = this.clone(this.latest)
            grid[row][column] = 'x'
            this.latest = grid
            this.#loop = true

            if (!this.validate(this.latest, row, column)) {
              this.#backtracking = true
            }
            break
          }
        }
        if (last === -1) {
          this.errorMessage = '这不是一个有效的逻辑绘图'
          this.duration = Date.now() - this.duration
          break
        }
      } else {
        for (let row = 0; row < this.#rows; row++) {
          const column = this.latest[row].findIndex(v => v === 'u')
          if (column > -1) {
            this.#tryAndError.push([this.#grid.length, row, column, 'o'])
            const grid = this.clone(this.latest)
            grid[row][column] = 'o'
            this.latest = grid
            this.#loop = true

            if (!this.validate(this.latest, row, column)) {
              this.#backtracking = true
            }
            break
          }
        }
      }
    }

    if (this.solved) {
      this.duration = Date.now() - this.duration
    }
  }

  oxTest (grid) {
    let loop = true
    while (loop) {
      this.#loopTime++
      loop = false
      for (let i = 0; i < this.#rows; i++) {
        for (let j = 0; j < this.#columns; j++) {
          if (grid[i][j] === 'u') {
            // 尝试 o
            grid[i][j] = 'o'

            if (this.validate(grid, i, j)) { // o 校验通过
              // 尝试 x
              grid[i][j] = 'x'

              if (this.validate(grid, i, j)) { // x 校验通过
                grid[i][j] = 'u'
              } else { // x 校验不通过，证明 o 是正解
                grid[i][j] = 'o'
                loop = true
              }
            } else { // o 校验不通过，证明 x 是正解
              grid[i][j] = 'x'
              loop = true
            }
          }
        }
      }
    }
  }

  validate (grid, row, column) {
    const [rowRegs, columnRegs] = this.regexps
    const row1 = grid[row].join('')
    const row2 = grid[row].slice().reverse().join('')
    const column1 = grid.map(v => v[column]).join('')
    const column2 = grid.map(v => v[column]).reverse().join('')
    const regs1 = rowRegs[row].slice()
    const regs2 = rowRegs[row].slice().reverse()
    const regs3 = columnRegs[column].slice()
    const regs4 = columnRegs[column].slice().reverse()
    let reg1 = '^[xu]*'
    let reg2 = '^[xu]*'
    let reg3 = '^[xu]*'
    let reg4 = '^[xu]*'
    let start = 0
    const end = Math.max(rowRegs[row].length, columnRegs[column].length)
    let res = true
    while (start < end && res) {
      let res1 = true
      if (rowRegs[row].length > start) {
        const suffix = start === rowRegs[row].length - 1 ? '[xu]*$' : '[xu]+'
        reg1 += regs1[start] + suffix
        reg2 += regs2[start] + suffix
        res1 = new RegExp(reg1).test(row1) && new RegExp(reg2).test(row2)
      }

      let res2 = true
      if (columnRegs[column].length > start) {
        const suffix = start === columnRegs[column].length - 1 ? '[xu]*$' : '[xu]+'
        reg3 += regs3[start] + suffix
        reg4 += regs4[start] + suffix
        res2 = new RegExp(reg3).test(column1) && new RegExp(reg4).test(column2)
      }

      start++

      res = res1 && res2
    }

    return res
  }

  clone (grid) {
    return grid.map(v => v.slice())
  }

  toRegExp () {
    // o - filled
    // x - crossed
    // u - unlabeled
    this.numbers.forEach((numbers, i) => {
      const cellCount = i ? this.#columns : this.#rows
      for (let j = 0; j < cellCount; j++) {
        const number = numbers[j]
        const reg = []
        for (let k = 0; k < number.length; k++) {
          reg.push('[uo]{' + number[k] + '}')
        }
        this.regexps[i][j] = reg
      }
    })
  }
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = Nonograms
}