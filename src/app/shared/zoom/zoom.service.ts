import { computed, Service, signal } from '@angular/core';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

@Service({ autoProvided: false })
export class ZoomService {
  readonly scale = signal(1);
  readonly percent = computed(() => Math.round(this.scale() * 100));

  zoomIn(): void {
    this.scale.update((value) =>
      Math.min(MAX_ZOOM, +(value + ZOOM_STEP).toFixed(2)),
    );
  }

  zoomOut(): void {
    this.scale.update((value) =>
      Math.max(MIN_ZOOM, +(value - ZOOM_STEP).toFixed(2)),
    );
  }
}
