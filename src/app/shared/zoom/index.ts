import { ZoomControlsComponent } from './zoom-controls.component';
import { ZoomScopeDirective } from './zoom-scope.directive';
import { ZoomableDirective } from './zoomable.directive';

export const ZOOM = [
  ZoomScopeDirective,
  ZoomableDirective,
  ZoomControlsComponent,
] as const;
