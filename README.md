# clearway-test

Angular-приложение для просмотра многостраничного документа и работы с текстовыми аннотациями (тестовое задание).

## Запуск

```bash
npm install
npm start
```

Открыть: [http://localhost:4200/document/1](http://localhost:4200/document/1)

Сборка:

```bash
npm run build
```

## Что реализовано

- документ открывается по URL `/document/:documentId`;
- данные документа загружаются через `DocumentApi` (мок `public/mocks/1.json`);
- вертикальный скролл страниц-изображений с ленивым дорендером через `@defer`;
- zoom `+` / `-` через CSS `zoom`, изолированный на область документа (`[appZoomScope]`);
- текстовые аннотации: создание по клику, перемещение, удаление;
- типы аннотаций расширяются через DI (`ANNOTATION_TYPES` multi-provider) без изменения `AnnotationsDirective`;
- кнопка "Сохранить" выводит в консоль документ и аннотации по страницам;
- routed-компонент получает данные документа через resolver и `withComponentInputBinding`, без `ActivatedRoute` и `DocumentApi` внутри самого компонента;
- на время resolve в `Shell` показывается лоадер (по событиям роутера `ResolveStart`/`ResolveEnd`).

## Организация кода

```
src/app/
  api/                        модели + API-сервисы (DocumentApi)
  shell/                      корневой компонент, лоадер на resolve
  shared/
    annotations/               директива-хост аннотаций и её композиция
    drag-and-drop/              DraggableDirective (драг через transform)
    host-rect/                  HostRectDirective (rect хоста без layout thrashing)
    zoom/                       ZoomService, ZoomableDirective, ZoomScopeDirective
  features/document-viewer/    routed-компонент, routes, resolver
```

## О чём стоит рассказать отдельно

### Core Web Vitals в document-viewer

В шаблоне `document-viewer.component.html` есть несколько решений, которые напрямую влияют на LCP, CLS и объём начальной работы браузера, и хочется объяснить, зачем они там.

Первая страница получает `[priority]="priority"`. `NgOptimizedImage` в ответ на это ставит `fetchpriority="high"` и убирает `loading="lazy"` - браузер начинает грузить самое крупное видимое изображение сразу, а не в общей очереди с остальными картинками. Именно это изображение и есть LCP-элемент страницы, так что приоритет достаётся ровно тому, чему нужно.

У `<img>` явно указаны `[width]`/`[height]` - `NgOptimizedImage` их требует и предупреждает в консоли, если забыть. Блок под картинку зарезервирован заранее, поэтому при догрузке изображения ничего не прыгает. У `@placeholder` для отложенных страниц тот же размер, что у `.viewer__page`, так что и подстановка реального контента при скролле не двигает layout.

Все страницы кроме первой рендерятся через `@defer (on viewport; prefetch on idle)`. DOM, стили и логика этих страниц (в том числе рендер аннотаций через `AnnotationsDirective`) не создаются, пока страница не окажется во вьюпорте - это снижает начальную нагрузку на main thread. `prefetch on idle` при этом в свободное время браузера заранее подгружает нужный chunk, чтобы в момент реального скролла не было сетевой задержки.

В сумме получается быстрый LCP для первого экрана, отсутствие прыжков вёрстки и растянутая по времени остальная работа вместо одного большого всплеска при первой отрисовке.

### withComponentInputBinding и resolver вместо ActivatedRoute в компоненте

```typescript
// document.routes.ts
{
  path: ':documentId',
  component: DocumentViewerComponent,
  resolve: { document: documentResolver },
}
```

```typescript
// document-viewer.component.ts
readonly documentId = input.required<string>();
readonly document = input.required<DocumentInfo>();
```

`documentResolver` сам достаёт `documentId` из `route.paramMap` и вызывает `DocumentApi`. `DocumentViewerComponent` про это ничего не знает: он просто говорит, какие данные ему нужны (`document: DocumentInfo`), а не как их добыть. Роутер (включён через `provideRouter(routes, withComponentInputBinding())` в `app.config.ts`) сам записывает результат resolver'а и path-параметр в инпуты компонента по совпадению имён.

По сути это инверсия зависимостей на границе routed-компонента: `DocumentApi` инжектится только в resolver, а компонент зависит от контракта `DocumentInfo`, а не от конкретного сервиса загрузки. Компонент проще тестировать и проще переиспользовать вне роутинга. Подробнее про сам подход можно почитать здесь: [withComponentInputBinding: уменьшаем связанность, инвертируем зависимости](https://habr.com/ru/articles/1078996/).

### Драг аннотаций через transform, а не через left/top

`DraggableDirective` во время активного жеста меняет только `[style.transform]`:

```typescript
protected readonly transform = computed(() => {
  const pointer = this.livePointer();
  if (!pointer) return this.baseTransform();
  const dx = (pointer.x - this.anchorPoint().x) / this.scale();
  const dy = (pointer.y - this.anchorPoint().y) / this.scale();
  return `${this.baseTransform()} translate(${dx}px, ${dy}px)`.trim();
});
```

`left`/`top` в процентах (`xPercent`/`yPercent`) обновляются один раз, на `pointerup`, в `commitDrag()` у `TextAnnotationComponent`. Пока идёт сам драг, каждый `pointermove` трогает только `transform`, а его браузер обрабатывает на этапе compositing, не пересчитывая layout соседних элементов. Поэтому перемещение аннотации не приводит к layout thrashing, даже если события указателя идут часто.

Деление на `scale` (синхронизируется с `ZoomService.scale()` в `TextAnnotationComponent`) компенсирует CSS `zoom` контейнера: `pointermove` всегда отдаёт координаты в обычных viewport-пикселях, независимо от зума, а `translate()` внутри зумленного контейнера интерпретируется уже в его локальной, отмасштабированной системе координат. Без этого деления аннотация при драге убегала бы от курсора пропорционально текущему уровню зума.

### Host directives как способ развести разнородную логику

`hostDirectives` в проекте используется не только в `AnnotationsDirective`:

- `AnnotationSurfaceDirective` собран из `HostRectDirective` (геометрия) и `ZoomService.scale()` - получается единый источник геометрического контекста для позиционирования;
- `AnnotationsDirective` состоит из `AnnotationSurfaceDirective` (геометрия), `AnnotationCollectionDirective` (CRUD-состояние на `model()`) и `AnnotationRenderer` (императивный рендер через `ComponentRef`) - три отдельных hostDirective вместо одной директивы на полторы сотни строк;
- `TextAnnotationComponent` подключает `DraggableDirective` для жеста, а сам занимается только доменной логикой текста и коммитом позиции.

Разница с одной директивой-монолитом ощутимая. Каждый кусок (геометрия, состояние, рендер, жест) можно тестировать и переиспользовать отдельно: `HostRectDirective` и `DraggableDirective` вообще не знают про аннотации и подойдут для любого другого UI. Публичный API директивы (алиасы `inputs`/`outputs` в конфиге `hostDirectives`) остаётся стабильным, даже если внутренняя реализация конкретной части меняется. И просто проще читать код: `AnnotationsDirective` теперь выглядит как список из трёх-четырёх строк композиции, а не как реализация всего сразу.

## Минусы и известные проблемы

**Аннотации слишком тесно связаны с zoom.** `AnnotationSurfaceDirective` инжектит `ZoomService` напрямую (`inject(ZoomService, { optional: true })`), а `TextAnnotationComponent` вручную прокидывает `draggable.scale.set(this.annotations.scale())`. Математика позиционирования аннотаций (деление на `scale` при драге, см. выше) неявно рассчитана на то, что зум реализован именно через CSS `zoom` на предке. Поменяется способ масштабирования контейнера, например на `transform: scale()`, и придётся лезть в геометрию аннотаций, хотя по смыслу это два разных слоя. Отчасти проблема уже смягчена - `scale` спрятан за `AnnotationContext`/`AnnotationSurfaceDirective`, конкретные типы аннотаций про `ZoomService` не знают. Дальше стоило бы отвязаться и от конкретного CSS-механизма зума: например, `AnnotationSurfaceDirective` получал бы `scale` через отдельный узкий токен, который `ZoomScopeDirective` предоставляет как деталь реализации, а не напрямую зависел от `ZoomService`.

**Ленивая загрузка роута document может ухудшать LCP при прямом заходе по ссылке.** `DOCUMENT_ROUTES` подключены через `loadChildren` (`app.routes.ts`), а всё приложение - обычный CSR: ни `@angular/ssr`, ни prerender не подключены. При прямом открытии `/document/1` браузеру нужно по очереди: скачать и распарсить основной бандл, забутстрапить Angular, дать роутеру смэтчить `document/*` и запросить ленивый chunk `document.routes`, выполнить `documentResolver` (HTTP-запрос к моку), и только после этого начнётся загрузка LCP-изображения первой страницы. До этого момента у браузера просто нет HTML с реальным контентом для отрисовки, только пустой shell. Тут подходящее решение - SSR (`@angular/ssr`), а не статический prerender: контент документа зависит от `documentId` в URL и приходит по сети динамически, так что заранее сгенерировать статический HTML под все возможные `documentId` на этапе сборки не получится (prerender хорош для конечного и известного на момент сборки набора страниц). SSR же рендерит HTML на каждый запрос: `<img>` первой страницы попадёт в начальную разметку с настоящим `src`, и preload scanner браузера начнёт грузить LCP-изображение параллельно с загрузкой JS, а не после полного бутстрапа Angular и последовательного запроса ленивого чанка. `TransferState` вдобавок избавит клиент от повторного HTTP-запроса резолвера при гидратации.

**Редактирование текста аннотации доступно только в момент её создания** (пока `annotation().text` пусто, см. `afterNextRender` в `TextAnnotationComponent`). Повторно войти в режим редактирования у существующей аннотации сейчас нельзя.

**Драг зависит от Pointer Events** (`setPointerCapture`). На совсем старых браузерах без их поддержки понадобится fallback на mouse events.

## Стек

- Angular 22 (signals, `input()`/`model()`, control flow, `@defer`, `NgOptimizedImage`, host directives)
- TypeScript strict
- RxJS
