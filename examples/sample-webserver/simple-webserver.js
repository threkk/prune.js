const { createServer } = require('http')
const { parse } = require('url')

let port = 3000
if (process.env.NODE_ENV === 'production') {
  port = 80
}

function helloWorld(req, res) {
  const { query } = parse(req.url, true)

  let name = 'world'
  if (query.name) {
    name = query.name
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`Hello ${name}!`)
}

const server = createServer(helloWorld)
server.listen(port)
