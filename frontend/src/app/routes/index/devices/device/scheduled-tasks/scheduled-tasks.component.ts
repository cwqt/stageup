import { Component, OnInit, Input } from "@angular/core";
import { DeviceService } from "src/app/services/device.service";

import {
  ITaskRoutine,
  TaskState,
  ITask,
  IDevice,
  IUser,
} from "@cxss/interfaces";

var cronstrue = require("cronstrue");

interface ITaskRoutineFe extends ITaskRoutine {
  activeTask: ITask;
}

@Component({
  selector: "app-scheduled-tasks",
  templateUrl: "./scheduled-tasks.component.html",
  styleUrls: ["./scheduled-tasks.component.scss"],
})
export class ScheduledTasksComponent implements OnInit {
  @Input() currentUser: IUser;
  @Input() authorUser: IUser;

  device: IDevice;
  routines: ITaskRoutineFe[] = [];
  loading: boolean = false;
  error: string = "";

  stateMap = {
    [TaskState.Complete]: "done",
    [TaskState.Failed]: "warning",
    [TaskState.Inactive]: "portable_wifi_off",
    [TaskState.Pending]: "pending",
    [TaskState.TimedOut]: "access_time",
  };

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.device = this.deviceService.lastActiveDevice.getValue();

    this.getTaskRoutines();
    setTimeout(() => {
      console.log(this.routines);
    }, 1000);
  }

  getTaskRoutines() {
    this.loading = true;
    this.deviceService
      .getTaskRoutines(this.authorUser._id, this.device._id)
      .then((routines: ITaskRoutine[]) => {
        this.routines = routines.map((routine: ITaskRoutine) => {
          return {
            ...routine,
            activeTask: routine.tasks.find(
              (t: ITask) => t.state == TaskState.Pending
            ),
          } as ITaskRoutineFe;
        });
      })
      .catch((e) => (this.error = e))
      .finally(() => (this.loading = false));
  }

  cronstrue(s: string) {
    return cronstrue.toString(s);
  }
}
