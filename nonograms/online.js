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

let filename = 'record/history.txt'
const ids = []
if (process.argv[2] === 'catalog') {
  filename = `record/${process.argv[3]}_${Date.now()}.txt`
  fetchList(process.argv[3])
} else {
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i]) {
      ids.push(...process.argv[i].split(','))
    }
  }
  solve(ids)
}

function fetchList (page) {
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
  reg.left.lastIndex = 0
  reg.top.lastIndex = 0
  reg.tr.lastIndex = 0
  reg.td.lastIndex = 0
  return new Promise(resolve => {
    const req = https.get({
      host,
      path: `/${id}`
    }, res => {
      console.info(`${host}/${id}`)
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

    req.on('error', e => {
      console.info('error', ids)
      resolve()
    })
  })
}

async function solve (ids) {
  const durations = []
  while (ids[0]) {
    const id = ids[0]
    const numbers = await fetchItem(id)
    if (numbers) {
      write(`\n${host}/${id} ${numbers[0].length}*${numbers[1].length} ${new Date().toLocaleDateString()}\n`)
      console.info(JSON.stringify(numbers))
      const res = new Nonograms(numbers)
      if (res.solved) {
        const nono = res.latest.map(row => row.join(' ').replace(/o/g, ' ').replace(/x/g, '■')) //  □
        write(nono.join('\n'))
      }
      console.info(JSON.stringify(res.latest))
      console.info(`${host}/${id} ${numbers[0].length}*${numbers[1].length} ${res.duration}`)
      console.info('================================================================')
      write(`\n${host}/${id} ${res.duration}ms\n`)
      durations.push({
        id,
        duration: res.duration
      })
      ids.shift()
    }
  }
  write('\n' + durations.sort((a, b) => b.duration - a.duration).map(v => v.id + ': ' + v.duration + 'ms').join('; '))
}

function write (text) {
  fs.appendFileSync(filename, text)
}
