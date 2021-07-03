class Nonograms {
  numbers = [[], []]
  regexps = [[], []]
  solved = false
  duration = 0 // 耗时
  errorMessage = '' // 错误信息
  #grid = [] // 盘面
  #rows = 0
  #columns = 0
  #loopTime = 0
  #loop = true // 是否循环执行
  #backtracking = false // 是否需要回溯
  #tryAndError = [] // 试数

  constructor (numbers, time = -1) {
    this.numbers = numbers
    this.#rows = numbers[0].length
    this.#columns = numbers[1].length

    const grid = Array(this.#rows).fill('').map(() => Array(this.#columns).fill('u'))
    this.#toRegExp()
    this.#fillMust(grid)
    this.#fillExtend(grid)
    this.#fillExtend(grid)
    this.latest = grid
    this.duration = Date.now()
    this.solve(time)
  }

  get latest () {
    return this.#grid[this.#grid.length - 1]
  }
  set latest (grid) {
    this.#grid.push(this.clone(grid))
  }

  solve (time) {
    this.solveSync(time)
    if (!this.solved && time > 0) {
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
          const { grid, row, column, value } = this.#tryAndError[last]
          if (value === 'x') {
            this.#tryAndError.length = last
            last--
          } else if (value === 'o') {
            this.#tryAndError[last].value = 'x'
            this.#grid.length = grid
            this.latest[row][column] = 'x'
            this.#loop = true

            if (!this.validate(row, column)) {
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
          const j = this.latest[i].findIndex(v => v === 'u')
          if (j > -1) {
            this.#tryAndError.push({
              grid: this.#grid.length,
              row: i,
              column: j,
              value: 'o'
            })
            const grid = this.clone(this.latest)
            grid[i][j] = 'o'
            this.latest = grid
            this.#loop = true

            if (!this.validate(i, j)) {
              this.#backtracking = true
            }
            break
          }
        }
      }
    }

    if (!this.#loop && this.latest.flat().filter(v => v === 'u').length === 0) {
      this.solved = true
      this.duration = Date.now() - this.duration
    }
  }

  validate (row, column) {
    const rows = this.latest[row].join('')
    const columns = this.latest.map(v => v[column]).join('')
    const [rowReg, columnReg] = this.regexps
    return rowReg[row].test(rows) && columnReg[column].test(columns)
  }

  clone (grid) {
    return grid.map(v => v.slice())
  }

  #fillExtend (grid) {
    this.numbers.forEach((numbers, i) => {
      const direction = i ? 'column' : 'row'
      const reverse = direction + '-reverse'
      const cellCount = i ? this.#rows : this.#columns
      numbers.forEach((number, j) => {
        _fill(number, j, direction, cellCount)
        _fill(number, j, reverse, cellCount)
      })
    })

    function _fill (number, i, direction, cellCount) {
      const isRow = direction.includes('row')
      const isReverse = direction.includes('reverse')
      // 找出排或列的单元格
      const cells = isRow ? grid[i] : grid.map(v => v[i])
      // 第一个或最后一个填充块的长度
      const length = isReverse ? number[number.length - 1] : number[0]
      // 边缘
      const edge = isReverse ? cellCount - 1 : 0

      let firstFill = isReverse ? cells.lastIndexOf('o') : cells.indexOf('o')
      if (firstFill === edge) {
        let [x, y] = [i, isReverse ? cellCount - length - 1 : length]
        if (!isRow) {
          [x, y] = [y, x]
        }
        if (grid[x][y] === 'u') {
          grid[x][y] = 'x'
        }
      }
      if (firstFill > -1) {
        // 填充
        while (isReverse ? firstFill > cellCount - length - 1 : firstFill < length) {
          const [x, y] = isRow ? [i, firstFill] : [firstFill, i]
          if (grid[x][y] === 'u') {
            grid[x][y] = 'o'
          }
          firstFill += (isReverse ? -1 : 1)
        }
      }
    }
  }

  #fillMust (grid) {
    this.numbers.forEach((numbers, i) => {
      const direction = i ? 'column' : 'row'
      const cellCount = i ? this.#rows : this.#columns
      numbers.forEach((number, j) => {
        // 计算排列所需的最少单元格数量
        const total = number.reduce((acc, cur) => acc + cur) + number.length - 1
        let start = 0
        const places = number.map(length => {
          const end = start + length - 1
          start = start + length + 1
          return {
            end,
            length
          }
        })
        places.filter(place => place.length + total > cellCount).forEach(place => {
          const diff = place.length + total - cellCount
          let k = 0
          while (k < diff) {
            const row = direction === 'row' ? j : place.end - k
            const column = direction === 'row' ? place.end - k : j
            grid[row][column] = 'o'
            k++
          }
        })
      })
    })
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