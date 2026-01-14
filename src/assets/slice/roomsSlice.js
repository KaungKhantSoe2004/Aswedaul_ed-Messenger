import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    rooms: [

    ]
};
const roomSlice = createSlice({
    name: "rooms",
    initialState,
    reducers : {
        setReduxRooms: (state,action)=> {
          state.rooms = action.payload;
          console.log(state.rooms, 'rooms in redux')
        },
        reSortingRooms: (state, action) => {
      const { room_id, message } = action.payload;

      console.log(room_id, message, 'is in resroging')
      // find the room index
      const roomIndex = state.rooms.findIndex(
        (room) => room._id === room_id
      );

      if (roomIndex === -1) return;

      // get the room
      const room = state.rooms[roomIndex];

      // update last_message
      room.last_message = message;

      // remove room from its current position
      state.rooms.splice(roomIndex, 1);
      state.rooms.unshift(room);

      console.log(JSON.parse(JSON.stringify(state.rooms)), 'rooms after resorting')
        }
    }
})


export const {setReduxRooms, reSortingRooms} = roomSlice.actions;
export default roomSlice.reducer;