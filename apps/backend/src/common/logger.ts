/*eslint new-cap: ["error", { "newIsCap": false }]*/
import { apiLogger } from "@core/shared/api";
import Env from "../env";

// (✿◕‿◕) uwu what's this
import uwuifier from "uwuify";
const uwuify = new uwuifier();

const logger = apiLogger("backend", "blue", Env.UWU_MODE ? uwuify.uwuify.bind(uwuify) : null);

export const { log, stream } = logger;