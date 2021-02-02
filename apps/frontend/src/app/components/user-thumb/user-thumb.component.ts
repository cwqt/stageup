import { Component, Input, OnInit } from '@angular/core';
import { IUserStub } from '@eventi/interfaces';

@Component({
  selector: 'app-user-thumb',
  templateUrl: './user-thumb.component.html',
  styleUrls: ['./user-thumb.component.scss']
})
export class UserThumbComponent implements OnInit {
  @Input() user:IUserStub;

  constructor() { }

  ngOnInit(): void {
  }

}
