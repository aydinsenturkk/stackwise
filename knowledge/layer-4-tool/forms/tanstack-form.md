# TanStack Form

## Core Concept

TanStack Form is a **headless, type-safe** form library with built-in Standard Schema support (Zod, Valibot, ArkType). It uses a **field-level API** with granular subscriptions for optimal performance.

---

## Basic Setup

```typescript
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

function CreateUserForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "USER" as "USER" | "ADMIN",
    },
    onSubmit: async ({ value }) => {
      await userService.create(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: z.string().min(1, "Name is required").max(100),
          onBlur: z.string().min(1, "Name is required"),
        }}
        children={(field) => (
          <div>
            <label htmlFor={field.name}>Name</label>
            <input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span>{field.state.meta.errors.map((e) => e.message).join(", ")}</span>
            )}
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Create"}
          </button>
        )}
      />
    </form>
  );
}
```

---

## Standard Schema Validation (no adapter needed)

Zod, Valibot, and ArkType schemas work directly — no adapter package required.

```typescript
import { z } from "zod";

// Form-level validation with Zod schema
const form = useForm({
  defaultValues: { firstName: "", lastName: "" },
  validators: {
    onChange: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});

// Field-level validation — pass Zod schemas directly
<form.Field
  name="email"
  validators={{
    onChange: z.email("Invalid email"),
    onBlur: z.string().min(1, "Email is required"),
  }}
/>
```

---

## Validation Timing

| Event      | When                              | Use Case                     |
| ---------- | --------------------------------- | ---------------------------- |
| `onChange`  | Every value change                | Real-time feedback           |
| `onBlur`   | When field loses focus            | Most fields (recommended)    |
| `onSubmit`  | On form submission               | Final validation             |
| `onMount`  | When field mounts                 | Pre-validate loaded data     |

---

## Async Validation

```typescript
<form.Field
  name="username"
  validators={{
    onChangeAsyncDebounceMs: 300,
    onChangeAsync: async ({ value }) => {
      const available = await userService.checkUsername(value);
      return available ? undefined : "Username is taken";
    },
  }}
  children={(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isValidating && <span>Checking...</span>}
      {field.state.meta.errors.map((err) => (
        <span key={err.message}>{err.message}</span>
      ))}
    </div>
  )}
/>
```

---

## Field State

| Property                  | Type       | Purpose                            |
| ------------------------- | ---------- | ---------------------------------- |
| `field.state.value`       | `T`        | Current field value                |
| `field.state.meta.errors` | `object[]` | Validation errors                  |
| `field.state.meta.isTouched` | `boolean` | Field has been blurred          |
| `field.state.meta.isDirty`   | `boolean` | Value differs from default      |
| `field.state.meta.isValidating` | `boolean` | Async validation in progress |
| `field.handleChange`      | `function` | Update value                       |
| `field.handleBlur`        | `function` | Trigger blur validation            |

---

## Form State with Subscribe

```typescript
// Subscribe to specific form state (granular re-renders)
<form.Subscribe
  selector={(state) => ({
    canSubmit: state.canSubmit,
    isSubmitting: state.isSubmitting,
    isDirty: state.isDirty,
    errors: state.errors,
  })}
  children={({ canSubmit, isSubmitting, isDirty, errors }) => (
    <div>
      {errors.length > 0 && <FormErrors errors={errors} />}
      <button disabled={!canSubmit || !isDirty}>
        {isSubmitting ? "Saving..." : "Submit"}
      </button>
    </div>
  )}
/>
```

### Form-Level State

| Property       | Type       | Purpose                              |
| -------------- | ---------- | ------------------------------------ |
| `canSubmit`    | `boolean`  | No errors and not submitting         |
| `isSubmitting` | `boolean`  | Submit handler is running            |
| `isDirty`      | `boolean`  | Any field changed from defaults      |
| `isTouched`    | `boolean`  | Any field has been blurred           |
| `isValid`      | `boolean`  | All validations pass                 |
| `errors`       | `object[]` | Form-level errors                    |
| `errorMap`     | `object`   | Errors grouped by validation event   |

---

## Array Fields

```typescript
function TeamMembersForm() {
  const form = useForm({
    defaultValues: {
      members: [{ name: "", email: "" }],
    },
    onSubmit: async ({ value }) => {
      await teamService.update(value);
    },
  });

  return (
    <form.Field name="members" mode="array">
      {(field) => (
        <div>
          {field.state.value.map((_, index) => (
            <div key={index}>
              <form.Field
                name={`members[${index}].name`}
                children={(subField) => (
                  <input
                    value={subField.state.value}
                    onChange={(e) => subField.handleChange(e.target.value)}
                  />
                )}
              />
              <form.Field
                name={`members[${index}].email`}
                children={(subField) => (
                  <input
                    value={subField.state.value}
                    onChange={(e) => subField.handleChange(e.target.value)}
                  />
                )}
              />
              <button type="button" onClick={() => field.removeValue(index)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => field.pushValue({ name: "", email: "" })}
          >
            Add Member
          </button>
        </div>
      )}
    </form.Field>
  );
}
```

### Array Field Methods

| Method          | Purpose                          |
| --------------- | -------------------------------- |
| `pushValue`     | Add item to end                  |
| `insertValue`   | Add item at index                |
| `removeValue`   | Remove item at index             |
| `swapValues`    | Swap two items                   |
| `moveValue`     | Move item to different index     |
| `replaceValue`  | Replace item at index            |

---

## Form-Level Validation

```typescript
const form = useForm({
  defaultValues: { password: "", confirmPassword: "" },
  validators: {
    onSubmit: z.object({
      password: z.string().min(8),
      confirmPassword: z.string(),
    }).refine(
      (data) => data.password === data.confirmPassword,
      { message: "Passwords must match", path: ["confirmPassword"] }
    ),
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

---

## Integration with TanStack Query

```typescript
function EditUserForm({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserInput) => userService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });

  const form = useForm({
    defaultValues: user ?? { name: "", email: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  // Reset form when server data changes
  useEffect(() => {
    if (user) form.reset(user);
  }, [user]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* fields */}
    </form>
  );
}
```

---

## DevTools

```typescript
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";

function App() {
  return (
    <>
      <AppContent />
      <TanStackDevtools
        config={{ hideUntilHover: true }}
        plugins={[formDevtoolsPlugin()]}
      />
    </>
  );
}
```

---

## React Hook Form vs TanStack Form

| Aspect              | React Hook Form          | TanStack Form               |
| ------------------- | ------------------------ | --------------------------- |
| API style           | Hook-based (`register`)  | Component-based (`Field`)   |
| Re-renders          | Form-level by default    | Field-level (granular)      |
| Validation          | Resolver pattern         | Built-in Standard Schema    |
| Async validation    | Manual                   | First-class with debounce   |
| Type safety         | Good                     | Excellent (inferred paths)  |
| Framework support   | React only               | React, Vue, Angular, Solid  |
| Ecosystem           | Mature, large            | Growing                     |

---

## Anti-Patterns

| Anti-Pattern                             | Solution                                     |
| ---------------------------------------- | -------------------------------------------- |
| Using `@tanstack/zod-form-adapter`       | No adapter needed — Zod works directly       |
| Reading `form.state` directly in render  | Use `form.Subscribe` for granular re-renders |
| Validation on every keystroke without debounce | Use `onChangeAsyncDebounceMs`          |
| Missing `e.preventDefault()` on form submit | Always prevent default in onSubmit handler |
| Defining validators inline on each render | Extract to constants or use schema objects  |
| Using index as key for array fields      | Use a stable ID from the data if available   |
| Not calling `field.handleBlur`           | Always wire `onBlur` for blur validation     |
