import {UserRole} from "./enums/UserRole";

export interface UserData {
    uuid : String,
    username : String,
    role : UserRole,
    ageVerified : Boolean
}
