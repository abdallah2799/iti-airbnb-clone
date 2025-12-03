import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { SearchBarComponent } from "./shared/components/search-bar/search-bar.component";
import { LoginModalComponent } from "./core/auth/login-modal/login-modal.component";
import { NgxSpinnerComponent } from "ngx-spinner";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginModalComponent, NgxSpinnerComponent, FooterComponent, ChatWidgetComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-project');
  ngOnInit(): void {
    initFlowbite();
  }
}
