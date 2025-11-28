import { Component } from '@angular/core';
import { RouterModule } from "@angular/router";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

@Component({
  selector: 'app-auth-layout',
  imports: [RouterModule, NavbarComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {

}
