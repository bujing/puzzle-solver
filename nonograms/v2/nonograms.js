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
    this.#toRegExp()
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
    this.#grid.push(this.#clone(grid))
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
    while (!this.solved && this.#loop && time !== 0) {
      time--
      this.#loopTime++
      this.#loop = false

      if (this.#backtracking) {
        this.#backtracking = false

        let last = this.#tryAndError.length - 1
        while (last > -1) {
          const { grid, row, column, value } = this.#tryAndError[last]
          if (value === 'x') {
            this.#tryAndError.length = last
            last--
          } else if (value === 'o') {
            this.#tryAndError[last].value = 'x'
            this.#grid.length = grid
            this.latest[row][column] = 'x'
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
        for (let i = 0; i < this.#rows; i++) {
          const j = i // v1
          const k = this.latest[j].findIndex(v => v === 'u')
          if (k > -1) {
            this.#tryAndError.push({
              grid: this.#grid.length,
              row: j,
              column: k,
              value: 'o'
            })
            const grid = this.#clone(this.latest)
            grid[j][k] = 'o'
            this.latest = grid
            this.#loop = true

            if (!this.validate(this.latest, j, k)) {
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
    const rows = grid[row].join('')
    const columns = grid.map(v => v[column]).join('')
    const [rowReg, columnReg] = this.regexps
    return rowReg[row].test(rows) && columnReg[column].test(columns)
  }

  #clone (grid) {
    return grid.map(v => v.slice())
  }

  #toRegExp () {
    // o - filled
    // x - crossed
    // u - unlabeled
    this.numbers.forEach((numbers, i) => {
      const cellCount = i ? this.#columns : this.#rows
      for (let j = 0; j < cellCount; j++) {
        const number = numbers[j]
        let reg = '^[xu]*'
        for (let k = 0; k < number.length; k++) {
          if (k) {
            reg += '[xu]+'
          }
          reg += '[uo]{' + number[k] + '}'
        }
        reg += '[xu]*$'
        this.regexps[i][j] = new RegExp(reg)
      }
    })
  }
}