import { Component, inject } from '@angular/core';

import { ZoomService } from './zoom.service';

@Component({
  selector: 'app-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrl: './zoom-controls.component.scss',
})
export class ZoomControlsComponent {
  protected readonly zoom = inject(ZoomService);
}
