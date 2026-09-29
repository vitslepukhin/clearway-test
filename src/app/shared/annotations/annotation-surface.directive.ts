import {
  Directive,
  computed,
  inject,
} from '@angular/core';

import { HostRectDirective } from '../host-rect/host-rect.directive';
import { ZoomService } from '../zoom/zoom.service';

@Directive({
  selector: '[appAnnotationSurface]',
  hostDirectives: [HostRectDirective],
  host: {
    '[style.position]': '"relative"',
  },
})
export class AnnotationSurfaceDirective {
  private readonly hostRectDirective = inject(HostRectDirective);
  private readonly zoomService = inject(ZoomService, { optional: true });

  readonly rect = computed(() => this.hostRectDirective.rect());
  readonly scale = computed(() => this.zoomService?.scale() ?? 1);
}
