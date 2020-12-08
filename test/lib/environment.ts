require("dotenv").config();

export interface IUserDetails {
    email: string;
    password: string;
    permissions: {[index:string]:boolean}
}

export enum UserRole {
    EnvAdmin        = "envadmin",
    SpaceAdmin      = "spaceadmin",
    ElevatedDocMan  = "elevateddocman",
    DocMan          = "docman",
    SpaceViewer     = "spaceviewer",
    LoggedOut       = "loggedout"
}

export interface IEnvironment {
    baseUrl: string;
    users: {[index in UserRole]: IUserDetails};
}

export const environment: IEnvironment = {
    baseUrl: process.env["BASE_URL"] as string,
    users: {
        [UserRole.EnvAdmin]: {
            email: "envadmin@mail.com",
            password: process.env["PASSWORD"] as string,
            permissions: {
                envAdmin: true,
                spaceAdmin: false,
                documentManagerElevated: false,
                documentManager: false,
                spaceViewer: false,
                noRights: false
            }
        },
        [UserRole.SpaceAdmin]: {
            email: "spaceadmin@mail.com",
            password: process.env["PASSWORD"] as string,
            permissions: {
                envAdmin: false,
                spaceAdmin: true,
                documentManagerElevated: false,
                documentManager: false,
                spaceViewer: false,
                noRights: false
            }
        },
        [UserRole.ElevatedDocMan]: {
            email: "elevateddocman@mail.com",
            password: process.env["PASSWORD"] as string,
            permissions: {
                envAdmin: false,
                spaceAdmin: true,
                documentManagerElevated: true,
                documentManager: true,
                spaceViewer: false,
                noRights: false
            }
        },
        [UserRole.DocMan]: {
            email: "docman@mail.com",
            password: process.env["PASSWORD"] as string,
            permissions: {
                envAdmin: false,
                spaceAdmin: true,
                documentManagerElevated: false,
                documentManager: true,
                spaceViewer: false,
                noRights: false
            }
        },
        [UserRole.SpaceViewer]: {
            email: "spaceviewer@mail.com",
            password: process.env["PASSWORD"] as string,
            permissions: {
                envAdmin: false,
                spaceAdmin: false,
                documentManagerElevated: false,
                documentManager: false,
                spaceViewer: true,
                noRights: false
            }
        },
        [UserRole.LoggedOut]: {
            email: "",
            password: "",
            permissions: {
                envAdmin: false,
                spaceAdmin: false,
                documentManagerElevated: false,
                documentManager: false,
                spaceViewer: false,
                noRights: true
            }
        }
    }
}