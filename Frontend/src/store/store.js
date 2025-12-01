import {configureStore} from "@reduxjs/toolkit"
import userSlice from "./reducers/userSlice"
import employeeTaskSlice from "./reducers/employeeTaskSlice"
import employeeSlice from "./reducers/employeeSlice"

export const store= configureStore ({

    reducer:{ 
        userReducer:userSlice,
        employeeTaskReducer: employeeTaskSlice,
        employeeReducer: employeeSlice,
    },

})