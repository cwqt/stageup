import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-copy-box',
  templateUrl: './copy-box.component.html',
  styleUrls: ['./copy-box.component.scss']
})
export class CopyBoxComponent implements OnInit {
  text = 'Testing';
  constructor() {}

  ngOnInit(): void {}
}
