import { Component } from '@angular/core';
import { RouterModule } from "@angular/router";
import { NavAuthComponent } from "../../../shared/components/nav-auth/nav-auth.component";

@Component({
  selector: 'app-auth-layout',
  imports: [RouterModule, NavAuthComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {

}
