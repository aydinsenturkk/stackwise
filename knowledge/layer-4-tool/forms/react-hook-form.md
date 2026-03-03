# React Hook Form

## Setup with Zod

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema } from "@project/contracts";
import type { z } from "zod";

type CreateUserInput = z.infer<typeof CreateUserSchema>;

function CreateUserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { name: "", email: "", role: "USER" },
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateUserInput) => {
    await userService.create(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving..." : "Create"}
      </button>
    </form>
  );
}
```

---

## Validation Modes

| Mode         | When Validates                          | Use Case             |
| ------------ | --------------------------------------- | -------------------- |
| `onSubmit`   | On form submit only                     | Simple forms         |
| `onBlur`     | On field blur + submit                  | Most forms (default) |
| `onChange`   | On every change + blur + submit         | Real-time feedback   |
| `onTouched`  | On first blur, then on every change     | Balance UX/perf      |
| `all`        | On blur + change + submit               | Critical forms       |

---

## Registration Methods

### `register` — Uncontrolled (preferred)

```typescript
<input {...register("email")} />
<select {...register("role")}>
  <option value="USER">User</option>
  <option value="ADMIN">Admin</option>
</select>
```

### `Controller` — Controlled (for custom components)

```typescript
import { Controller } from "react-hook-form";

<Controller
  name="role"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={error?.message}
    />
  )}
/>
```

### When to Use Which

| Method       | When                                      |
| ------------ | ----------------------------------------- |
| `register`   | Native HTML inputs (input, select, textarea) |
| `Controller` | Custom UI components (Select, DatePicker, Rich Editor) |

---

## Form State

| Property         | Type      | Purpose                                   |
| ---------------- | --------- | ----------------------------------------- |
| `isDirty`        | `boolean` | Any field changed from default             |
| `isValid`        | `boolean` | All validations pass                       |
| `isSubmitting`   | `boolean` | Form submission in progress                |
| `isSubmitted`    | `boolean` | Form was submitted at least once           |
| `errors`         | `object`  | Field-level error messages                 |
| `dirtyFields`    | `object`  | Which fields have been modified            |
| `touchedFields`  | `object`  | Which fields have been touched (blurred)   |

---

## Field Arrays

```typescript
import { useFieldArray } from "react-hook-form";

function TeamForm() {
  const { control, register } = useForm<TeamInput>({
    defaultValues: { members: [{ name: "", email: "" }] },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "members",
  });

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`members.${index}.name`)} />
          <input {...register(`members.${index}.email`)} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", email: "" })}>
        Add Member
      </button>
    </>
  );
}
```

### Field Array Methods

| Method    | Purpose                           |
| --------- | --------------------------------- |
| `append`  | Add item to end                   |
| `prepend` | Add item to start                 |
| `insert`  | Add item at index                 |
| `remove`  | Remove item at index              |
| `move`    | Move item from one index to another |
| `swap`    | Swap two items                    |
| `replace` | Replace entire array              |

---

## Form Reset and Watch

```typescript
const { reset, watch, setValue, getValues } = useForm<FormInput>();

// Reset to defaults or new values
reset();
reset({ name: "New Name", email: "new@email.com" });

// Watch specific field (causes re-render)
const watchedRole = watch("role");

// Watch all fields (use sparingly)
const allValues = watch();

// Set value programmatically
setValue("role", "ADMIN", { shouldValidate: true, shouldDirty: true });

// Get value without re-render
const currentName = getValues("name");
```

### Watch vs getValues

| Method      | Re-renders | Use Case                          |
| ----------- | ---------- | --------------------------------- |
| `watch`     | Yes        | UI depends on field value         |
| `getValues` | No         | Read value in event handler       |

---

## Multi-Step Forms

```typescript
function MultiStepForm() {
  const [step, setStep] = useState(0);
  const methods = useForm<FullFormInput>({
    resolver: zodResolver(FullFormSchema),
    mode: "onBlur",
  });

  const steps = [
    <PersonalInfoStep key="personal" />,
    <AddressStep key="address" />,
    <ReviewStep key="review" />,
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {steps[step]}
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}
        {step < steps.length - 1 ? (
          <button type="button" onClick={async () => {
            const valid = await methods.trigger(stepFields[step]);
            if (valid) setStep(step + 1);
          }}>Next</button>
        ) : (
          <button type="submit">Submit</button>
        )}
      </form>
    </FormProvider>
  );
}

// In child step components
function PersonalInfoStep() {
  const { register, formState: { errors } } = useFormContext<FullFormInput>();
  return <input {...register("name")} />;
}
```

---

## Integration with TanStack Query

```typescript
function EditUserForm({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
  });

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    values: user, // Syncs form with server data
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserInput) => userService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* fields */}
    </form>
  );
}
```

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                      |
| ----------------------------------------- | --------------------------------------------- |
| Using `useState` for each form field      | Use `useForm` with `register`                 |
| `Controller` for native HTML inputs       | Use `register` (better performance)           |
| `watch()` without arguments               | Watch specific fields or use `getValues`      |
| Manual validation in `onSubmit`           | Use `zodResolver` with schema                 |
| `key={index}` in field arrays             | Use `key={field.id}` from `useFieldArray`     |
| Re-creating `defaultValues` on each render| Memoize or define outside component           |
| `mode: "onChange"` for all forms          | Use `onBlur` by default, `onChange` only when needed |
