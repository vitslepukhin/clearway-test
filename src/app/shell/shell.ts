import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  ResolveEnd,
  ResolveStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, merge } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);

  protected readonly resolving = toSignal(
    merge(
      this.router.events.pipe(
        filter((event) => event instanceof ResolveStart),
        map(() => true),
      ),
      this.router.events.pipe(
        filter(
          (event) =>
            event instanceof ResolveEnd ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        map(() => false),
      ),
    ),
    { initialValue: false },
  );
}
