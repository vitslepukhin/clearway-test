import { Directive } from '@angular/core';

import { ZoomService } from './zoom.service';

@Directive({
  selector: '[appZoomScope]',
  providers: [ZoomService],
})
export class ZoomScopeDirective {}
