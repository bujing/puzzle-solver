// target: https://onlinenonograms.com/
const https = require('https')
const fs = require('fs')
const { execSync } = require('child_process')
const Nonograms = require('./v3colored')

const host = 'onlinenonograms.com'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let color
const reg = {
  catitems: /<a href="(\d+)">.*?<\/a>/g,
  left: /<table[^>]*id="cross_left"[^>]*>(.*?)<\/table>/g,
  top: /<table[^>]*id="cross_top"[^>]*>(.*?)<\/table>/g,
  tr: /<tr[^>]*>(.*?)<\/tr>/g,
  td: /<td[^>]*>(.*?)<\/td>/g
}

let filename = 'record.txt'
let isCatalog = process.argv[2] === 'bw' || process.argv[2] === 'colored'
const ids = []
if (isCatalog) {
  const color = process.argv[2]
  const page = process.argv[3]
  filename = `puzzle/${color}_${page}_${Date.now()}.txt`
  fetchList(color, page)
} else {
  isCatalog = process.argv[2] === 'catitem'
  for (let i = (isCatalog ? 3 : 2); i < process.argv.length; i++) {
    if (process.argv[i]) {
      ids.push(...process.argv[i].split(','))
    }
  }
  solve(ids)
}

const log = function (...val) {
  console.log(...val)
  fs.appendFileSync(filename, val.join(' ') + '\n')
}

function fetchList (color, page) {
  reg.catitems.lastIndex = 0
  return new Promise(resolve => {
    https.get({
      host,
      path: '/index.php?place=catalog&kat=0&color=' + color + '&size=huge&star=&filtr=all&sort=sortsizea&noset=2&page=' + page
    }, res => {
      const buffer = []
      res.on('data', chunk => buffer.push(chunk))
      res.on('end', () => {
        const bufferData = Buffer.concat(buffer).toString()
        let item
        while (item = reg.catitems.exec(bufferData)) {
          if (item[1]) {
            // ids.push(item[1])
            const res = execSync(`node crawler catitem ${item[1]}`, { stdio: [0, 'pipe', 2] })
            log(res.toString())
          }
        }
        // solve(ids)
      })
    })
  })
}

function fetchItem (id) {
  reg.left.lastIndex = 0
  reg.top.lastIndex = 0
  reg.tr.lastIndex = 0
  reg.td.lastIndex = 0
  color = { '#000000': 'A' }
  return new Promise(resolve => {
    const req = https.get({
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
                const bgc = /<td[^>]*background-color: (\#[0-9a-zA-Z]{6})[^>]*>.*?<\/td>/gi.exec(td[0])
                let letter = 'A'
                if (bgc && bgc[1]) {
                  if (!color[bgc[1]]) {
                    const l = Object.keys(color).length
                    letter = letters[l]
                    color[bgc[1]] = letters[l]
                  } else {
                    letter = color[bgc[1]]
                  }
                }
                number.push(letter + td[1])
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
                const bgc = /<td[^>]*background-color: (\#[0-9a-zA-Z]{6})[^>]*>.*?<\/td>/gi.exec(td[0])
                let letter = 'A'
                if (bgc && bgc[1]) {
                  if (!color[bgc[1]]) {
                    const l = Object.keys(color).length
                    letter = letters[l]
                    color[bgc[1]] = letters[l]
                  } else {
                    letter = color[bgc[1]]
                  }
                }
                numbers[1][i].push(letter + td[1])
              }
              i++
            }
          }
        }
        resolve(numbers)
      })
    })

    req.on('error', e => {
      resolve()
    })
  })
}

async function solve (ids) {
  while (ids[0]) {
    const id = ids[0]
    const numbers = await fetchItem(id)
    if (numbers) {
      const cs = Object.keys(color).reduce((acc, cur) => {
        acc[color[cur]] = cur
        return acc
      }, {})
      const res = new Nonograms(numbers, cs)
      if (!isCatalog) {
        console.log(cs)
        console.log(JSON.stringify(numbers))
        console.log(JSON.stringify(res.latest))
      }
      console.log(`${host}/${id} ${numbers[0].length}*${numbers[1].length} ${res.duration}ms`)
      if (res.solved) {
        const nono = res.latest.map(row => row.join(' ').replace(/x/g, ' '))
        console.log(nono.join('\n'))
      }
      ids.shift()
    }
  }
}
