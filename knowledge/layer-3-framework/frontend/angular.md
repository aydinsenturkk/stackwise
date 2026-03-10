# Angular

> Focuses on modern Angular (v17+): standalone components, signals, `inject()`, control flow, zoneless. Legacy NgModules and zone.js noted where relevant for migration.

## Standalone Components

All new components are standalone by default (since Angular v19, `standalone: true` is implicit).

```typescript
// user-card.component.ts
import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { User } from '@/types';

@Component({
  selector: 'app-user-card',
  imports: [DatePipe],
  template: `
    <div class="user-card">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      <p>Joined: {{ user().createdAt | date:'mediumDate' }}</p>
      <button (click)="edit.emit(user())">Edit</button>
    </div>
  `,
  styles: [`
    .user-card { padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
  `],
})
export class UserCardComponent {
  user = input.required<User>();
  edit = output<User>();
}
```

### Component Rules

| Do | Don't |
| -- | ----- |
| No need to specify `standalone: true` (default since v19) | Create NgModules for new code |
| Import only needed dependencies | Import entire SharedModule |
| Use signal-based inputs/outputs | Use `@Input()`/`@Output()` decorators |
| Co-locate template if small | Always use separate `.html` file |

---

## Signals and Reactivity

Signals are Angular's reactive primitive (v16+), replacing zone.js change detection for fine-grained reactivity.

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Doubled: {{ doubled() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  constructor() {
    // allowSignalWrites removed in v19 — effects can write signals by default
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }

  increment() {
    this.count.update(c => c + 1);
    // or: this.count.set(this.count() + 1);
  }
}
```

### Signal API

| Method | Purpose | Example |
| ------ | ------- | ------- |
| `signal(value)` | Create writable signal | `count = signal(0)` |
| `computed(() => ...)` | Derived signal | `doubled = computed(() => count() * 2)` |
| `.set(value)` | Replace value | `count.set(5)` |
| `.update(fn)` | Update based on current | `count.update(c => c + 1)` |
| `effect(() => ...)` | Side effect on signal change | Logging, sync to localStorage |
| `linkedSignal(() => ...)` | Writable signal that resets when source changes | `selectedUser = linkedSignal(() => this.users()[0])` |

### Signal Inputs and Outputs

```typescript
// Signal-based I/O (Angular 17.1+)
import { input, output, model } from '@angular/core';

export class UserFormComponent {
  userId = input.required<string>();     // Required input
  isEditable = input(false);             // Optional with default
  save = output<User>();                 // Output
  name = model('');                      // Two-way binding (like ngModel)
}
```

```html
<!-- Parent template -->
<app-user-form
  [userId]="selectedId"
  [(name)]="userName"
  (save)="onSave($event)"
/>
```

### linkedSignal

```typescript
users = signal<User[]>([]);
selectedUser = linkedSignal(() => this.users()[0]);
// Writable signal that resets when source changes; can still be set manually
```

### Signal-Based View Queries

```typescript
myElement = viewChild.required<ElementRef>('myEl');
items = viewChildren(MyComponent);
```

---

## Dependency Injection

### inject() Function

```typescript
import { Component, inject } from '@angular/core';
import { UsersService } from './users.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ /* ... */ })
export class UserDetailComponent {
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
}
```

### Providing Services

```typescript
// Application-level (singleton)
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZonelessChangeDetection(), // Stable in v20.2+ — no zone.js needed
    UsersService,
  ],
};

// Component-level (new instance per component)
@Component({
  providers: [FormStateService],
})
export class UserFormComponent {}

// Route-level
const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminService],
    children: [/* ... */],
  },
];
```

### InjectionToken

```typescript
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// Provide: { provide: API_BASE_URL, useValue: 'https://api.example.com' }
// Inject: private apiUrl = inject(API_BASE_URL);
```

---

## Template Syntax

### Built-in Control Flow (v17+)

```html
<!-- Conditional -->
@if (user()) {
  <app-user-card [user]="user()" />
} @else {
  <p>No user found</p>
}

<!-- Iteration -->
@for (item of items(); track item.id) {
  <app-list-item [item]="item" />
} @empty {
  <p>No items</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <p>Error occurred</p> }
  @default { <app-content /> }
}

<!-- Deferred loading -->
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div class="chart-placeholder"></div>
} @loading (minimum 200ms) {
  <app-spinner />
}
```

### Event Binding

```html
<button (click)="handleClick($event)">Click</button>
<input (keyup.enter)="onSubmit()" />
<form (ngSubmit)="submitForm()">
```

---

## HttpClient

```typescript
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ /* ... */ })
export class UsersComponent {
  private http = inject(HttpClient);

  // Convert Observable to Signal
  users = toSignal(this.http.get<User[]>('/api/users'), {
    initialValue: [],
  });

  // Imperative approach
  isLoading = signal(false);

  async createUser(data: CreateUserDto) {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.http.post<User>('/api/users', data));
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### resource() and httpResource() (Angular 20+)

Signal-based async data fetching — no RxJS boilerplate needed.

```typescript
// httpResource — shorthand for HTTP GET
users = httpResource<User[]>('/api/users', { defaultValue: [] });

// resource — custom async logic, re-fetches when signals change
userData = resource({
  request: () => this.userId(),
  loader: async ({ request: id }) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json() as Promise<User>;
  },
});
// Access: userData.value(), userData.isLoading(), userData.error()
```

### HTTP Interceptors (Functional)

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]));
```

---

## Routing

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./user-detail/user-detail.component'),
    resolve: { user: userResolver },
  },
  { path: '**', component: NotFoundComponent },
];

// Functional guard
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login']);
};

// Functional resolver
export const userResolver: ResolveFn<User> = (route) => {
  return inject(UsersService).getById(route.paramMap.get('id')!);
};
```

### Route Parameters

```typescript
// With signals (Angular 16+)
import { input } from '@angular/core';

@Component({ /* ... */ })
export class UserDetailComponent {
  // Route params bound to inputs (requires withComponentInputBinding())
  id = input.required<string>();
}

// In app.config.ts
provideRouter(routes, withComponentInputBinding());
```

---

## Reactive Forms

```typescript
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" />
      @if (form.controls.name.errors?.['required']) {
        <span class="error">Name is required</span>
      }
      <input formControlName="email" type="email" />
      <button [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.valid) {
      const value = this.form.getRawValue(); // Typed { name: string; email: string }
      console.log(value);
    }
  }
}
```

---

## RxJS Patterns

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({ /* ... */ })
export class SearchComponent {
  searchTerm = signal('');

  // Signal → Observable → Signal pipeline
  results = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.http.get<Result[]>(`/api/search?q=${term}`)),
    ),
    { initialValue: [] },
  );
}
```

### When to Use RxJS vs Signals

| Use Signals | Use RxJS |
| ----------- | -------- |
| Simple derived state | Complex async streams |
| Component inputs/state | Debounce, throttle, retry |
| Template bindings | Multi-event coordination |
| Most component logic | WebSocket streams |

---

## Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load users', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/users');
    req.flush([{ id: '1', name: 'John' }]);
    fixture.detectChanges();

    expect(component.users()).toHaveLength(1);
  });
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| NgModules for new code | Unnecessary boilerplate | Use standalone components |
| Constructor injection | Verbose, requires class fields | Use `inject()` function |
| `*ngIf`/`*ngFor` directives | Deprecated in favor of control flow | Use `@if`, `@for`, `@switch` |
| Subscribe in components without cleanup | Memory leaks | Use `toSignal()`, `takeUntilDestroyed()`, or `async` pipe |
| Zone.js-dependent change detection | Performance overhead | Use signals for new code |
| Barrel files re-exporting everything | Breaks tree-shaking | Import directly from source |
| Template-driven forms for complex forms | Limited validation control | Use Reactive Forms |
| `any` in HTTP responses | Lose type safety | Always type: `http.get<User[]>(...)` |
