// https://onlinenonograms.com/
const https = require('https')
const fs = require('fs')
const Nonograms = require('./v2oxtest')

const log = console.log
console.log = function (...val) {
  write(val.join(' ') + '\n')
  log(...val)
}

const host = 'onlinenonograms.com'

const reg = {
  catitems: /<a href="(\d+)">.*?<\/a>/g,
  left: /<table[^>]*id="cross_left"[^>]*>(.*?)<\/table>/g,
  top: /<table[^>]*id="cross_top"[^>]*>(.*?)<\/table>/g,
  tr: /<tr[^>]*>(.*?)<\/tr>/g,
  td: /<td[^>]*>(.*?)<\/td>/g
}

const ids = []
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i]) {
    ids.push(...process.argv[i].split(','))
  }
}
if (ids[0] === 'catalog') {
  fetchList(ids[1])
} else {
  solve(ids)
}

function fetchList (page) {
  console.log(`\nBlack And White / Huge / P${page}`)
  reg.catitems.lastIndex = 0
  return new Promise(resolve => {
    https.get({
      host,
      path: '/index.php?place=catalog&kat=0&color=bw&size=huge&star=&filtr=all&sort=sortsizea&noset=2&page=' + page
    }, res => {
      const buffer = []
      res.on('data', chunk => buffer.push(chunk))
      res.on('end', () => {
        const bufferData = Buffer.concat(buffer).toString()
        let ids = []
        let item
        while (item = reg.catitems.exec(bufferData)) {
          if (item[1]) {
            ids.push(item[1])
          }
        }
        solve(ids)
      })
    })
  })
}

function fetchItem (id) {
  console.info(`${host}/${id}`)
  reg.left.lastIndex = 0
  reg.top.lastIndex = 0
  reg.tr.lastIndex = 0
  reg.td.lastIndex = 0
  return new Promise(resolve => {
    https.get({
      host,
      path: `/${id}`
    }, res => {
      const buffer = []
      res.on('data', chunk => buffer.push(chunk))
      res.on('end', () => {
        const bufferData = Buffer.concat(buffer).toString()
        const left = reg.left.exec(bufferData)
        const top = reg.top.exec(bufferData)
        const numbers = [[], []]
        if (left) {
          let tr
          while (tr = reg.tr.exec(left[1])) {
            const number = []
            let td
            while (td = reg.td.exec(tr[1])) {
              if (td[1]) {
                number.push(Number(td[1]))
              }
            }
            numbers[0].push(number)
          }
        }
        if (top) {
          let tr
          while (tr = reg.tr.exec(top[1])) {
            let td
            let i = 0
            while (td = reg.td.exec(tr[1])) {
              if (!numbers[1][i]) numbers[1][i] = []
              if (td[1]) {
                numbers[1][i].push(Number(td[1]))
              }
              i++
            }
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
    write(`\n${host}/${id} ${numbers[0].length}*${numbers[1].length} ${new Date().toLocaleDateString()}\n`)
    console.info(JSON.stringify(numbers))
    const res = new Nonograms(numbers)
    if (res.solved) {
      const nono = res.latest.map(row => row.join(' ').replace(/o/g, ' ').replace(/x/g, '■')) //  □
      console.info(nono.join('\n'))
    }
    console.info(JSON.stringify(res.latest))
    console.info(`${host}/${id} ${numbers[0].length}*${numbers[1].length} ${res.duration}`)
    console.info('================================================================')
    write(`${host}/${id} ${res.duration}ms\n`)
  }
}

function write (text) {
  fs.appendFileSync('history.txt', text)
}
