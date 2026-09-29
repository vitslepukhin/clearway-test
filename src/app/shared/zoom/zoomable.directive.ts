import { Directive, inject } from '@angular/core';

import { ZoomService } from './zoom.service';

@Directive({
  selector: '[appZoomable]',
  host: {
    '[style.zoom]': 'zoom.scale()',
  },
})
export class ZoomableDirective {
  protected readonly zoom = inject(ZoomService);
}
