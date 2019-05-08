const { createServer } = require('http')
const { parse } = require('url')

function helloWorld(req, res) {
  const { query } = parse(req.url, true)

  let name = 'world'
  if (query.name) {
    name = query.name
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`Hello ${name}!`)
}

const server = createServer(helloWorld)
server.listen(3000)
