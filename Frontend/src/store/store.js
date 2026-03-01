import {configureStore} from "@reduxjs/toolkit"
import userSlice from "./reducers/userSlice"
import employeeTaskSlice from "./reducers/employeeTaskSlice"
import employeeSlice from "./reducers/employeeSlice"
import notificationSlice from "./reducers/notificationSlice"
import announcementSlice from "./reducers/announcementSlice"
import messageSlice from "./reducers/messageSlice"
import channelSlice from "./reducers/channelSlice"

export const store= configureStore ({

    reducer:{ 
        userReducer:userSlice,
        employeeTaskReducer: employeeTaskSlice,
        employeeReducer: employeeSlice,
        notificationReducer: notificationSlice,
        announcementReducer: announcementSlice,
        messageReducer: messageSlice,
        channelReducer: channelSlice,
    },
})