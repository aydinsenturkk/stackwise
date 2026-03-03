# shadcn/ui

## Core Concept

shadcn/ui is NOT a component library — it's a collection of re-usable components you copy into your project. You own the code and customize freely.

```bash
# Add components
npx shadcn@latest add button
npx shadcn@latest add dialog card input label
npx shadcn@latest add --all  # Add everything

# Migrations (update existing components)
npx shadcn@latest migrate --list     # List available migrations
npx shadcn@latest migrate radix      # Consolidate Radix imports
npx shadcn@latest migrate rtl        # Add RTL support
npx shadcn@latest migrate icons      # Update icon imports
```

---

## Project Structure

| Path                        | Content                            |
| --------------------------- | ---------------------------------- |
| `components/ui/`            | shadcn base components (generated) |
| `components/`               | App-specific composed components   |
| `lib/utils.ts`              | `cn()` helper                      |
| `components.json`           | shadcn configuration               |

---

## Component Composition Pattern

```tsx
// components/user-card.tsx — Compose from shadcn primitives
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{user.name}</CardTitle>
          <Badge variant={user.active ? "default" : "secondary"}>
            {user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={() => onEdit(user.id)}>
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## Variants with `cva`

```typescript
// components/ui/button.tsx (customized)
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

---

## Common Components

### Dialog (Modal)

```tsx
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Make changes to your profile.</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form with shadcn + React Hook Form + Zod

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function UserForm() {
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

### Data Table (with TanStack Table)

```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
  <TableBody>
    {table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Theme Colors

shadcn uses CSS custom properties with HSL values. Override in `globals.css`:

| Variable               | Purpose                         |
| ---------------------- | ------------------------------- |
| `--background`         | Page background                 |
| `--foreground`         | Default text                    |
| `--primary`            | Primary brand color             |
| `--primary-foreground` | Text on primary background      |
| `--secondary`          | Secondary actions               |
| `--muted`              | Muted backgrounds               |
| `--muted-foreground`   | Muted text (descriptions)       |
| `--accent`             | Hover/focus backgrounds         |
| `--destructive`        | Error/delete actions            |
| `--border`             | Default borders                 |
| `--ring`               | Focus ring color                |

---

## Radix UI Imports

shadcn components use Radix UI primitives. Import from the unified `radix-ui` package.

```tsx
// Current: unified package
import { Dialog as DialogPrimitive, Select as SelectPrimitive } from "radix-ui";

// Legacy: individual packages (migrate with `npx shadcn@latest migrate radix`)
// import * as DialogPrimitive from "@radix-ui/react-dialog"
// import * as SelectPrimitive from "@radix-ui/react-select"
```

---

## `asChild` Pattern

```tsx
// Render as a different element using Radix Slot
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// Button styles applied to the Link, no extra DOM node
```

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                     |
| ----------------------------------------- | -------------------------------------------- |
| Modifying `components/ui/` files heavily  | Create wrapper components in `components/`   |
| Installing a separate UI library alongside | Use shadcn as the single component system   |
| Hardcoded colors instead of theme tokens  | Use `text-primary`, `bg-muted`, etc.         |
| Skipping `asChild` for link buttons       | Use `asChild` with `Link` for navigation     |
| Not using `FormField` with React Hook Form| Use shadcn `Form` components for consistency |
| Custom modal implementation               | Use `Dialog` from shadcn (Radix-based, accessible) |
| Ignoring Radix accessibility props        | Keep `aria-*` props, they're there for a reason |
| Individual `@radix-ui/react-*` imports    | Use unified `radix-ui` package               |
