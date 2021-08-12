// https://onlinenonograms.com/
const https = require('https')
const fs = require('fs')
const Sudoku = require('./sudoku')

const log = console.log
console.log = function (...val) {
  write(val.join(' ') + '\n')
  log(...val)
}

const host = 'grid.websudoku.com'

const reg = {
  table: /<table[^>]*id="puzzle_grid"[^>]*>(.*?)<\/table>/gi,
  td: /<td[^>]*>(.*?)<\/td>/gi,
  input: /<input[^>]*value="(\d)"[^>]*>/gi
}

let filename = 'record/history.txt'
const ids = []
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i]) {
    ids.push(...process.argv[i].split(','))
  }
}
solve(ids)

function fetchItem (id) {
  console.info(`${host}/?level=4&set_id=${id}`)
  reg.table.lastIndex = 0
  reg.td.lastIndex = 0
  reg.input.lastIndex = 0
  return new Promise(resolve => {
    https.get({
      host,
      path: `/?level=4&set_id=${id}`
    }, res => {
      const buffer = []
      res.on('data', chunk => buffer.push(chunk))
      res.on('end', () => {
        const bufferData = Buffer.concat(buffer).toString()
        const table = reg.table.exec(bufferData)
        const numbers = []
        if (table) {
          let td
          let i = 0
          while (td = reg.td.exec(table[1])) {
            if (i % 9 === 0) numbers.push([])
            const input = reg.input.exec(td[1])
            const row = Math.floor(i / 9)
            numbers[row].push(input ? Number(input[1]) : 0)
            i++
          }
        }
        resolve(numbers)
      })
    })
  })
}

async function solve (ids) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const numbers = await fetchItem(id)
    write(`\n${host}/?level=4&set_id=${id} ${numbers[0].length}*${numbers[1].length} ${new Date().toLocaleDateString()}\n`)
    console.log(numbers.map(row => ' ' + row.join(' | ').replace(/0/g, ' ') + ' ').join('\n-----------------------------------\n'))
    console.log('\n')
    const res = new Sudoku(numbers)
    if (res.valueCount === 81) {
      console.log(res.latest.map(row => ' ' + row.join(' | ') + ' ').join('\n-----------------------------------\n'))
    }
    console.info(`${host}/?level=4&set_id=${id} ${numbers[0].length}*${numbers[1].length} ${res.duration}`)
    console.info('================================================================')
    write(`${host}/?level=4&set_id=${id} ${res.duration}ms\n`)
  }
}

function write (text) {
  fs.appendFileSync(filename, text)
}
