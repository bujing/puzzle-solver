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
    // while (this.#loop) {
    //   this.#loop = false;
    //   this.nakedSingle();
    //   this.hiddenSingle();
    // }
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
        this.steps[index] = {
          index: this.#stepIndex,
          value,
          remark: "提示数",
        };
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
        this.steps[index] = {
          index: -1,
          value: candidates.filter(Boolean),
          other,
        };
        this.grid[index] = candidates.filter(Boolean);
      }
    });
  }

  // 删除候选数
  delCandidates(value, index) {
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
        this.grid[i] = value[0];
        // 更新填数步骤
        this.steps[i].index = ++this.#stepIndex;
        this.steps[i].value = value[0];
        this.steps[i].remark = "显式唯一法：单元格中只有一个候选数";
        // 从其所在行、列和宫的其他单元格的候选数中删除
        this.delCandidates(value[0], i);
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
          this.steps[i].value = value[0];
          this.steps[i].remark = "隐式唯一法：候选数只出现在一个单元格中";
          // 从其所在行、列和宫的其他单元格的候选数中删除
          this.delCandidates(value[0], i);
          current = i;
          break;
        }
      }

      if (current > -1) break;
    }
    return current;
  }

  // 区块删减法
  intersectionRemoval() {}
}

if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = Sudoku;
}
