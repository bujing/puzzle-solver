// target: https://onlinenonograms.com/
const https = require("https");
const fs = require("fs");
const { execSync } = require("child_process");
const Nonograms = require("./v3colored");

const action = process.argv[2];
const category = process.argv[3];
const target = process.argv[4];

if (
  (action !== "fetch" && action !== "solve") ||
  (category !== "bw" && category !== "colored" && category !== "item")
) {
  console.log(`
node crawler <action> <category> <target>

action: 'fetch' | 'solve'
category: 'bw' | 'colored' | 'item'
target: number[,number] // pages or ids
  `);
  return;
}

const host = "onlinenonograms.com";
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const reg = {
  catitems: /<a href="(\d+)">.*?<\/a>/g,
  left: /<table[^>]*id="cross_left"[^>]*>(.*?)<\/table>/g,
  top: /<table[^>]*id="cross_top"[^>]*>(.*?)<\/table>/g,
  tr: /<tr[^>]*>(.*?)<\/tr>/g,
  td: /<td[^>]*>(.*?)<\/td>/g,
};
let filename = "puzzle/record.txt";

init();

async function init() {
  if (!fs.existsSync("puzzle")) fs.mkdirSync("puzzle");
  const targets = target.split(",");
  for (let i = 0; i < targets.length; i++) {
    if (category === "item") {
      await fetchItem(targets[i]);
    } else {
      filename = `puzzle/${action}_${category}_${targets[i]}_${Date.now()}.txt`;
      await fetchList(category, targets[i]);
    }
  }
}

function log(...val) {
  console.log(...val);
  fs.appendFileSync(filename, val.join(" ") + "\n");
}

function fetchList(color, page) {
  reg.catitems.lastIndex = 0;
  return new Promise((resolve) => {
    https.get(
      {
        host,
        path:
          "/index.php?place=catalog&kat=0&color=" +
          color +
          "&size=huge&star=&filtr=all&sort=sortsizea&noset=2&page=" +
          page,
      },
      (res) => {
        const buffer = [];
        res.on("data", (chunk) => buffer.push(chunk));
        res.on("end", async () => {
          const bufferData = Buffer.concat(buffer).toString();
          let item;
          while ((item = reg.catitems.exec(bufferData))) {
            if (item[1]) {
              await fetchItem(item[1]);
              // const res = execSync(`node crawler ${action} item ${item[1]}`, {
              //   stdio: [0, "pipe", 2],
              // });
              // log(res.toString());
            }
          }
          resolve();
        });
      }
    );
  });
}

function fetchItem(id) {
  reg.left.lastIndex = 0;
  reg.top.lastIndex = 0;
  reg.tr.lastIndex = 0;
  reg.td.lastIndex = 0;
  const color = { "#000000": "A" };
  return new Promise((resolve) => {
    const req = https.get({ host, path: `/${id}` }, (res) => {
      const buffer = [];
      res.on("data", (chunk) => buffer.push(chunk));
      res.on("end", () => {
        const bufferData = Buffer.concat(buffer).toString();
        const left = reg.left.exec(bufferData);
        const top = reg.top.exec(bufferData);
        const numbers = [[], []];
        if (left) {
          let tr;
          while ((tr = reg.tr.exec(left[1]))) {
            const number = [];
            let td;
            while ((td = reg.td.exec(tr[1]))) {
              if (td[1]) {
                const bgc =
                  /<td[^>]*background-color: (\#[0-9a-zA-Z]{6})[^>]*>.*?<\/td>/gi.exec(
                    td[0]
                  );
                let letter = "A";
                if (bgc && bgc[1]) {
                  if (!color[bgc[1]]) {
                    const l = Object.keys(color).length;
                    letter = letters[l];
                    color[bgc[1]] = letters[l];
                  } else {
                    letter = color[bgc[1]];
                  }
                }
                number.push(letter + td[1]);
              }
            }
            numbers[0].push(number);
          }
        }
        if (top) {
          let tr;
          while ((tr = reg.tr.exec(top[1]))) {
            let td;
            let i = 0;
            while ((td = reg.td.exec(tr[1]))) {
              if (!numbers[1][i]) numbers[1][i] = [];
              if (td[1]) {
                const bgc =
                  /<td[^>]*background-color: (\#[0-9a-zA-Z]{6})[^>]*>.*?<\/td>/gi.exec(
                    td[0]
                  );
                let letter = "A";
                if (bgc && bgc[1]) {
                  if (!color[bgc[1]]) {
                    const l = Object.keys(color).length;
                    letter = letters[l];
                    color[bgc[1]] = letters[l];
                  } else {
                    letter = color[bgc[1]];
                  }
                }
                numbers[1][i].push(letter + td[1]);
              }
              i++;
            }
          }
        }
        const colors = Object.keys(color).reduce((acc, cur) => {
          acc[color[cur]] = cur;
          return acc;
        }, {});
        const res = action === "solve" ? new Nonograms(numbers, colors) : {};
        log(
          `${host}/${id} ${numbers[0].length}*${numbers[1].length}` +
            (res.duration ? ` ${res.duration}ms` : "")
        );
        log(JSON.stringify(colors));
        log(JSON.stringify(numbers));
        if (res.latest) {
          log(JSON.stringify(res.latest));
        }
        if (res.solved) {
          const nono = res.latest.map((row) =>
            row.join(" ").replace(/x/g, " ")
          );
          log(nono.join("\n"));
        }
        log();
        resolve();
      });
    });
  });
}
