let _io = null;

export const setIO = (io) => { _io = io; };
export const getIO = () => _io;

export const emitToRestaurant = (restaurantId, event, data) => {
  if (_io) _io.to(`restaurant:${restaurantId}`).emit(event, data);
};
