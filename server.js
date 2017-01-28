//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http')
var path = require('path')
  // var request = require('request') ///zac killed this
const rp = require('request-promise')

var async = require('async')
var socketio = require('socket.io')
var express = require('express')
var parser = require('xml2json')


// var steamgames;

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//


var router = express()
var server = http.createServer(router)
var io = socketio.listen(server)

router.use(express.static(path.resolve(__dirname, 'client')))
var messages = []
var sockets = []

io.on('connection', function(socket) {
  sockets.push(socket)
  socket.on('disconnect', function() {})

  socket.on('steamID', function(profile, id) {
    var steamgames = getSteamGames(profile, id);
    setTimeout(function() {
      socket.emit('steamGames', steamgames)
    }, 3500);
  })
})

function updateRoster() {
  async.map(
    sockets,
    function(socket, callback) {
      socket.get('name', callback)
    },
    function(err, names) {
      broadcast('roster', names)
    }
  )
}

function broadcast(event, data) {
  sockets.forEach(function(socket) {
    socket.emit(event, data)
  })
}

function getSteamGames(profile, id) {
  // http://steamcommunity.com/profiles/76561197985405022/games?tab=all&xml=1
  var options = {
    method: 'GET',
    url: 'http://steamcommunity.com/' + profile + '/' + id + '/games',
    qs: {
      tab: 'all',
      xml: '1'
    },
    headers: {
      'cache-control': 'no-cache'
    }
  }

  return rp(options)
    .then(function(response) {
      // console.log(response)
      return parser.toJson(response)
    })
    .catch(function(err) {
      console.log(err)
      return err
    })
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address()
  console.log("Chat server listening at", addr.address + ":" + addr.port)
})
