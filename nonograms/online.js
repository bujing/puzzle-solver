// https://onlinenonograms.com/
const https = require('https')
const Nonograms = require('./v2/nonograms')

const host = 'onlinenonograms.com'

const reg = {
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
solve(ids)

function fetch (id) {
  console.log(`${host}/${id}`)
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
    const numbers = await fetch(id)
    console.log(JSON.stringify(numbers))
    const res = new Nonograms(numbers)
    if (res.solved) {
      const nono = res.latest.map(row => row.join('').replace(/o/g, '  ').replace(/x/g, '■ ')) //  □
      console.log(nono.join('\n'))
    }
    console.log(JSON.stringify(res.latest))
    console.log('================================================================')
  }
}
