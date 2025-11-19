import { Component } from '@angular/core';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-blank-layout',
  imports: [NavbarComponent, RouterModule],
  templateUrl: './blank-layout.component.html',
  styleUrl: './blank-layout.component.css',
})
export class BlankLayoutComponent {

}
