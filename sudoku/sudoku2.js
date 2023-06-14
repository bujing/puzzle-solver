class Sudoku {
  gridSize = 9; // 盘面尺寸，标准是9*9数独，还有4*4/6*6/12*12等等
  boxSize = [3, 3]; // 宫大小，9*9数独是3行3列，6*6数独是2行3列，12*12数独是4行3列等等
  base = []; // 初盘
  grid = []; // 盘面
  steps = []; // 步骤数组
  #stepIndex = 0; // 步骤索引
  #regions = ["box", "row", "column"];
  #loop = true;

  // 单元格数量
  get cellCount() {
    return Math.pow(this.gridSize, 2);
  }
  // 明数数量
  get valueCount() {
    return this.grid.filter((v) => typeof v === "number").length;
  }

  constructor(grid) {
    if (!grid) {
      grid = this.creator();
    } else if (typeof grid === "string") {
      grid = grid.split(",");
    } else if (Array.isArray(grid)) {
      grid = grid.flat();
    }
    grid = grid.map((v) =>
      isNaN(v) ? 0 : Math.min(this.gridSize, Math.max(0, Number(v)))
    );
    if (grid.length < this.cellCount) {
      grid.push(...Array(this.cellCount - grid.length).fill(0));
    } else if (grid.length > this.cellCount) {
      grid.splice(this.cellCount);
    }

    this.checker(grid);
    this.getCandidates(grid);
    // let current = -1;
    // do {
    //   current = this.nakedSingle();
    //   if (current === -1) {
    //     current = this.hiddenSingle();
    //   }
    // } while (current > -1);
    console.log(this.steps);
    console.log(this.grid);
  }

  creator() {
    return [];
  }

  checker(grid) {
    this.base = grid.slice();
  }

  filledChecker(index) {
    return typeof this.grid[index] === "number";
  }

  getCellNamed(index) {
    const letters = "ABCDEFGHI";
    const letter = Math.floor(index / 9);
    const number = (index % 9) + 1;
    return letters[letter] + number;
  }

  // 按指定单元格下标索引获取其所在的行、列或宫的所有单元格的下标索引
  getRegionByIndex(index, type = "box") {
    if (type === "box") {
      const [boxRowCount, boxColumnCount] = this.boxSize;
      const minRow =
        Math.floor(index / this.gridSize / boxRowCount) * boxRowCount;
      const minColumn =
        Math.floor((index % this.gridSize) / boxColumnCount) * boxColumnCount;
      const indexs = [];
      for (let i = 0; i < boxRowCount; i++) {
        for (let j = 0; j < boxColumnCount; j++) {
          indexs.push((minRow + i) * this.gridSize + (minColumn + j));
        }
      }
      return indexs;
    } else if (type === "row") {
      const row = Math.floor(index / this.gridSize);
      return Array(this.gridSize)
        .fill(0)
        .map((v, i) => i + row * this.gridSize);
    } else if (type === "column") {
      const column = index % this.gridSize;
      return Array(this.gridSize)
        .fill(0)
        .map((v, i) => column + i * this.gridSize);
    }
  }

  // 提取候选数
  getCandidates(grid) {
    grid.forEach((value, index) => {
      if (value) {
        this.steps[index] = { index: this.#stepIndex, solve: 0 };
        this.grid[index] = value;
      } else {
        const candidates = Array(this.gridSize + 1)
          .fill()
          .map((v, i) => i);
        const other = Array(this.gridSize + 1).fill();
        this.#regions.forEach((region) => {
          const indexs = this.getRegionByIndex(index, region);
          indexs.forEach((i) => {
            if (grid[i]) {
              candidates[grid[i]] = 0;
              other[grid[i]] = other[grid[i]] ?? i;
            }
          });
        });
        this.grid[index] = candidates.filter(Boolean);
        this.steps[index] = { index: -1, other };
      }
    });
  }

  // 删除候选数
  delCandidates(index) {
    const value = this.grid[index];
    this.#regions.forEach((region) => {
      const indexs = this.getRegionByIndex(index, region);
      indexs.forEach((i) => {
        if (this.filledChecker(i)) return;
        this.grid[i] = this.grid[i].filter((v) => v !== value);
        this.steps[i].value = this.grid[i].slice();
        this.steps[i].other[value] = this.steps[i].other[value] ?? index;
      });
    });
  }

  // 显式唯一法，某一单元格只有一个候选数
  nakedSingle() {
    let current = -1;
    for (let i = 0; i < this.cellCount; i++) {
      if (this.filledChecker(i)) continue;
      if (this.grid[i].length === 1) {
        // 填入唯一候选数
        this.grid[i] = this.grid[i][0];
        // 更新填数步骤
        this.steps[i].index = ++this.#stepIndex;
        this.steps[i].solve = 1;
        // 从其所在行、列和宫的其他单元格的候选数中删除
        this.delCandidates(i);
        current = i;
        break;
      }
    }
    return current;
  }

  // 隐式唯一法，某一候选数只出现在一个单元格
  hiddenSingle() {
    let current = -1;
    for (let i = 0; i < this.cellCount; i++) {
      if (this.filledChecker(i)) continue;

      for (let j = 0; j < this.#regions.length; j++) {
        const region = this.#regions[j];
        const indexs = this.getRegionByIndex(i, region).filter((v) => v !== i);
        const regionCandidates = indexs.reduce((acc, cur) => {
          if (!this.filledChecker(cur)) {
            acc.push(...this.grid[cur]);
          }
          return acc;
        }, []);
        const value = this.grid[i].filter((v) => !regionCandidates.includes(v));
        // if (value.length > 1) return; // 无解的数独
        if (value.length === 1) {
          this.#loop = true;
          // 填入唯一候选数
          this.grid[i] = value[0];
          // 更新填数步骤
          this.steps[i].index = ++this.#stepIndex;
          this.steps[i].solve = 2;
          this.steps[i].other = indexs.filter((v) => !this.filledChecker(v));
          // 从其所在行、列和宫的其他单元格的候选数中删除
          this.delCandidates(i);
          current = i;
          break;
        }
      }

      if (current > -1) break;
    }
    return current;
  }

  // 区块删减法
  intersectionRemoval() {
    const boxCell = Array(this.gridSize)
      .fill()
      .map(() => []);
    const rowCell = Array(this.gridSize)
      .fill()
      .map(() => []);
    const columnCell = Array(this.gridSize)
      .fill()
      .map(() => []);
    const cells = [];
    for (let i = 0; i < this.cellCount; i++) {
      if (this.filledChecker(i)) continue;
      const row = Math.floor(i / this.gridSize);
      const column = i % this.gridSize;
      const box =
        (Math.floor(row / this.boxSize[0]) * this.gridSize) / this.boxSize[0] +
        Math.floor(column / this.boxSize[1]);

      boxCell[box].push(i);
      rowCell[row].push(i);
      columnCell[column].push(i);
      cells.push({
        index: i,
        value: this.grid[i],
        box: boxCell[box],
        row: rowCell[row],
        column: columnCell[column],
      });
    }
    cells.forEach((cell) => {
      // 遍历单元格候选数
      cell.value.forEach((value) => {
        console.log(this.getCellNamed(cell.index) + " 单元格，候选数 " + value);
        // 检查候选数是否在同宫同行的单元格出现
        const isInBoxSameRow = cell.row
          .filter((v) => cell.box.includes(v) && v !== cell.index)
          .some((v) => this.grid[v].includes(value));
        if (isInBoxSameRow) {
          console.log("候选数 " + value + " 在同宫同行出现");
          // 检查候选数是否在同宫异行的单元格出现
          const isInBoxOtherRow = cell.row
            .filter((v) => !cell.box.includes(v) && v !== cell.index)
            .some((v) => this.grid[v].includes(value));
          if (!isInBoxOtherRow) {
            console.log(
              `候选数 ${value} 未在同宫异行出现，则说明候选数不能出现在异宫同行的单元格中`
            );
            const indexs = this.getRegionByIndex(cell.index, "row")
            indexs.filter(v => !cell.row.includes(v)).forEach(v => {
              if (!this.filledChecker(v)) {
                this.grid[v] = this.grid[v].filter(v => v !== value)
              }
            })
          }

          // 检查候选数是否在异宫同行的单元格出现
          const isOutBoxSameRow = cell.row
          .filter((v) => !cell.box.includes(v))
          .some((v) => this.grid[v].includes(value));
          if (!isOutBoxSameRow) {
            console.log(
              `候选数 ${value} 未在异宫同行出现，则说明候选数不能出现在同宫异行的单元格中`
            );
            const indexs = this.getRegionByIndex(cell.index, "box")
            indexs.filter(v => !cell.row.includes(v)).forEach(v => {
              if (!this.filledChecker(v)) {
                this.grid[v] = this.grid[v].filter(v => v !== value)
              }
            })
          }
        }
      });
    });
  }
}

if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = Sudoku;
}
