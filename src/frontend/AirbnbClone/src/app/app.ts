import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { SearchBarComponent } from "./shared/components/search-bar/search-bar.component";
import { LoginModalComponent } from "./core/auth/login-modal/login-modal.component";
import { NgxSpinnerComponent } from "ngx-spinner";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, SearchBarComponent, LoginModalComponent, NgxSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-project');
  ngOnInit(): void {
      initFlowbite();
  }
}
