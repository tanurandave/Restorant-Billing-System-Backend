const jwt = require('jsonwebtoken');

const setupSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // User joins their own order room
    socket.join(`user:${socket.user.id}`);
    
    // Admin joins admin room
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    // Listen for client events
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });

    // Listen for order tracking
    socket.on('track:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Listen for admin order updates
    socket.on('admin:orderStatusUpdate', (data) => {
      if (socket.user.role === 'admin') {
        io.to(`order:${data.orderId}`).emit('order:statusUpdated', {
          orderId: data.orderId,
          status: data.status,
          message: `Your order status: ${data.status}`
        });

        io.to('admin').emit('order:updated', data);
      }
    });
  });

  return io;
};

module.exports = setupSocket;