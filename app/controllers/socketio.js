module.exports = (io) => {
io.on('connection', (socket) => {
  var s = socket;
  // console.log('socket connected');
  // console.log(socket.request.user.username);
});
}