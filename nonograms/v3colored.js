class Nonograms {
  color = {};
  numbers = [[], []];
  colors = [[], []];
  regexps = [[], []];
  duration = 0; // 耗时
  errorMessage = ""; // 错误信息
  #grid = []; // 盘面
  #rows = 0;
  #columns = 0;
  #loopTime = 0;
  #loop = true; // 是否循环执行
  #backtracking = false; // 是否需要回溯
  #tryAndError = []; // 试数

  constructor(numbers, color = { A: "#000000" }, time = -1, pause = false) {
    // console.log(JSON.stringify(color))
    // console.log(JSON.stringify(numbers))
    this.numbers = numbers;
    this.color = color;
    this.#rows = numbers[0].length;
    this.#columns = numbers[1].length;
    this.toRegExp();
    this.duration = Date.now();
    const grid = Array(this.#rows)
      .fill("")
      .map(() => Array(this.#columns).fill("u"));
    // this.oxNaked(grid)
    // this.oxHidden(grid)
    this.oxTest(grid);
    this.latest = grid;
    if (this.solved) {
      this.duration = Date.now() - this.duration;
    } else {
      this.solve(time, pause);
    }
  }

  get latest() {
    return this.#grid[this.#grid.length - 1];
  }
  set latest(grid) {
    this.#grid.push(this.clone(grid));
  }

  get solved() {
    return this.latest.flat().filter((v) => v === "u").length === 0;
  }

  solve(time, pause) {
    this.solveSync(time);
    if (!this.solved && time > 0 && !pause) {
      window.setTimeout(() => {
        this.solve(time);
      }, 0);
    }
  }

  solveSync(time) {
    while (this.#loop && time !== 0) {
      time--;
      this.#loopTime++;
      this.#loop = false;

      if (this.#backtracking) {
        this.#backtracking = false;

        let last = this.#tryAndError.length - 1;
        while (last > -1) {
          const [index, row, column, value] = this.#tryAndError[last];
          if (value === "x") {
            this.#tryAndError.length = last;
            last--;
          } else if (value !== "u") {
            const colors = this.colors[row][column];
            this.#tryAndError[last][3] =
              this.#tryAndError[last][4] === colors.length
                ? "x"
                : colors[this.#tryAndError[last][4]];
            this.#grid.length = index;
            const grid = this.clone(this.latest);
            grid[row][column] = this.#tryAndError[last][3];
            this.#tryAndError[last][4] += 1;
            this.latest = grid;
            this.#loop = true;

            if (!this.validate(this.latest, row, column)) {
              this.#backtracking = true;
            }
            break;
          }
        }
        if (last === -1) {
          this.errorMessage = "这不是一个有效的逻辑绘图";
          this.duration = Date.now() - this.duration;
          break;
        }
      } else {
        for (let row = 0; row < this.#rows; row++) {
          const column = this.latest[row].findIndex((v) => v === "u");
          if (column > -1) {
            const colors = this.colors[row][column];
            this.#tryAndError.push([
              this.#grid.length,
              row,
              column,
              colors[0],
              1,
            ]);
            const grid = this.clone(this.latest);
            grid[row][column] = colors[0];
            this.latest = grid;
            this.#loop = true;

            if (!this.validate(this.latest, row, column)) {
              this.#backtracking = true;
            }
            break;
          }
        }
      }
    }

    if (this.solved) {
      this.duration = Date.now() - this.duration;
    }
  }

  oxTest(grid) {
    let loop = true;
    while (loop) {
      this.#loopTime++;
      // console.log(`round ${this.#loopTime}`, new Date().toTimeString().substr(0, 8) + '.' + new Date().getMilliseconds())
      loop = false;
      for (let row = 0; row < this.#rows; row++) {
        if (!this.colors[row]) this.colors[row] = [];
        for (let column = 0; column < this.#columns; column++) {
          if (grid[row][column] === "u") {
            if (!this.colors[row][column]) {
              this.colors[row][column] = Object.keys(this.color);
            }
            const colors = this.colors[row][column];
            for (let i = colors.length - 1; i >= 0; i--) {
              const color = colors[i];
              // 尝试 color
              grid[row][column] = color;
              // 校验不通过，移除
              if (!this.validate(grid, row, column)) {
                colors.splice(i, 1);
              }
              grid[row][column] = "u";
            }
            if (colors.length === 0) {
              // 没有 color 校验通过
              grid[row][column] = "x";
              loop = true;
            } else if (colors.length === 1) {
              // 只有一个 color 校验通过
              // 尝试 x
              grid[row][column] = "x";

              if (this.validate(grid, row, column)) {
                // x 校验通过
                grid[row][column] = "u";
              } else {
                // x 校验不通过
                grid[row][column] = colors[0];
                loop = true;
              }
            }
          }
        }
      }
    }
  }

  oxNaked(grid) {
    this.numbers.forEach((numbers, isColumn) => {
      const cellCount = isColumn ? this.#rows : this.#columns;
      numbers.forEach((number, j) => {
        // 计算排列所需的最少单元格数量
        const total = number.length
          ? number.reduce((acc, cur) => acc + cur) + number.length - 1
          : 0;
        if (total === 0) {
          for (let i = 0; i < cellCount; i++) {
            const [row, column] = isColumn ? [i, j] : [j, i];
            grid[row][column] = "x";
          }
        } else {
          let start = 0;
          const places = number.map((length) => {
            start += length;
            return {
              end: start++ - 1,
              exceed: length + total - cellCount,
            };
          });
          places
            .filter((place) => place.exceed > 0)
            .forEach((place) => {
              let k = 0;
              while (k < place.exceed) {
                const i = place.end - k;
                const [row, column] = isColumn ? [i, j] : [j, i];
                if (grid[row]) {
                  grid[row][column] = "o";
                }
                k++;
              }
            });
        }
      });
    });
  }

  oxHidden(grid) {
    let loop = true;
    while (loop) {
      loop = false;

      this.numbers.forEach((numbers, isColumn) => {
        const cellCount = isColumn ? this.#rows : this.#columns;
        numbers.forEach((number, index) => {
          _fill(number, index, cellCount, isColumn, false);
          _fill(number, index, cellCount, isColumn, true);
        });
      });
    }

    function _fill(number, i, cellCount, isColumn, isReverse) {
      // 找出排或列的单元格
      const cells = isColumn ? grid.map((v) => v[i]) : grid[i];
      // 第一个或最后一个填充块的长度
      const length = isReverse ? number[number.length - 1] : number[0];
      // 边缘
      const edge = isReverse ? cellCount - 1 : 0;

      let o1st = isReverse ? cells.lastIndexOf("o") : cells.indexOf("o");
      if (o1st === edge) {
        const j = isReverse ? cellCount - length - 1 : length;
        const [x, y] = isColumn ? [j, i] : [i, j];
        if (grid[x] && grid[x][y] === "u") {
          grid[x][y] = "x";
          loop = true;
        }
      }
      if (o1st > -1) {
        // 填充
        while (isReverse ? o1st > cellCount - length - 1 : o1st < length) {
          const [x, y] = isColumn ? [o1st, i] : [i, o1st];
          if (grid[x][y] === "u") {
            grid[x][y] = "o";
            loop = true;
          }
          o1st += isReverse ? -1 : 1;
        }
      }
    }
  }

  validate(grid, row, column) {
    const [rowRegs, columnRegs] = this.regexps;
    const rowReverse = Math.round(column / this.#columns);
    const columnReverse = Math.round(row / this.#rows);

    let rows = grid[row].slice();
    if (rowReverse) {
      rows.reverse();
    }
    rows = rows.join("");
    let columns = grid.map((v) => v[column]);
    if (columnReverse) {
      columns.reverse();
    }
    columns = columns.join("");

    if (rowRegs[row][rowReverse].test(rows)) {
      return columnRegs[column][columnReverse].test(columns);
    }
    return false;
  }

  clone(grid) {
    return grid.map((v) => v.slice());
  }

  toRegExp() {
    // o-filled x-crossed u-unlabeled
    this.numbers.forEach((numbers, i) => {
      const cellCount = i ? this.#columns : this.#rows;
      for (let j = 0; j < cellCount; j++) {
        const number = numbers[j];
        const reg = [];
        let prev = "";
        for (let k = 0; k < number.length; k++) {
          let initial = "";
          if (/^[a-z]/i.test(number[k])) {
            initial = number[k][0];
          }
          if (k) {
            reg.push("[xu]" + (initial === prev ? "+" : "*"));
          }
          if (initial) {
            prev = initial;
            reg.push("[" + initial + "u]{" + number[k].substring(1) + "}");
          } else {
            reg.push("[Au]{" + number[k] + "}");
          }
        }
        this.regexps[i][j] = [
          new RegExp(`^[xu]*${reg.join("")}[xu]*$`),
          new RegExp(`^[xu]*${reg.reverse().join("")}[xu]*$`),
        ];
      }
    });
  }
}

if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = Nonograms;
}
