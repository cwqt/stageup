import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-landing',
  templateUrl: './client-landing.component.html',
  styleUrls: ['./client-landing.component.scss']
})
export class ClientLandingComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  gotoLogin() {
    this.router.navigate(['/login']);
  }
  
  gotoRegister() {
    this.router.navigate(['/register']);
  }
}
