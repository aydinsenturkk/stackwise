# TanStack Table

## Core Concept

TanStack Table is a **headless** table library — it provides logic (sorting, filtering, pagination) but no UI. You render the table however you want (with shadcn/ui, plain HTML, etc.).

---

## Basic Setup

```typescript
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge>{row.getValue("role")}</Badge>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

function UsersTable({ data }: { data: User[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
  );
}
```

---

## Column Definitions

| Property        | Purpose                                    |
| --------------- | ------------------------------------------ |
| `accessorKey`   | Maps to data property                      |
| `accessorFn`    | Custom accessor function                   |
| `id`            | Unique ID (required if no `accessorKey`)   |
| `header`        | Header content (string or render function) |
| `cell`          | Cell content (render function)             |
| `footer`        | Footer content                             |
| `enableSorting` | Enable/disable sorting for column          |
| `enableColumnFilter` | Enable/disable filtering for column   |
| `size`          | Default column width                       |

```typescript
const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right">Amount</span>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <span className="text-right font-medium">{formatCurrency(amount)}</span>;
    },
  },
];
```

---

## Sorting

```typescript
import { getSortedRowModel, type SortingState } from "@tanstack/react-table";

function SortableTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // In header render:
  // <TableHead
  //   className="cursor-pointer select-none"
  //   onClick={header.column.getToggleSortingHandler()}
  // >
  //   {flexRender(...)}
  //   {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
  // </TableHead>
}
```

---

## Filtering

```typescript
import { getFilteredRowModel, type ColumnFiltersState } from "@tanstack/react-table";

function FilterableTable({ data }: { data: User[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
      {/* Per-column filter */}
      <Input
        placeholder="Filter by name..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
      />
      {/* Table render */}
    </div>
  );
}
```

---

## Pagination

### Client-Side

```typescript
import { getPaginationRowModel } from "@tanstack/react-table";

const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

const table = useReactTable({
  data,
  columns,
  state: { pagination },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

// Pagination controls
<div className="flex items-center gap-2">
  <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
    Previous
  </Button>
  <span>
    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
  </span>
  <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
    Next
  </Button>
</div>
```

### Server-Side

```typescript
function ServerTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data } = useQuery({
    queryKey: userKeys.list({ page: pagination.pageIndex + 1, limit: pagination.pageSize, sort: sorting }),
    queryFn: () => userService.getAll({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sort: sorting[0]?.id,
      order: sorting[0]?.desc ? "desc" : "asc",
    }),
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    rowCount: data?.total ?? 0,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });
}
```

### Client vs Server-Side

| Feature           | Client-Side              | Server-Side              |
| ----------------- | ------------------------ | ------------------------ |
| Data size         | < 1000 rows              | Any size                 |
| Row models        | `getPaginationRowModel`  | `manualPagination: true` |
| Sort/Filter       | `getSortedRowModel`, etc.| `manualSorting: true`    |
| `rowCount`        | Auto-calculated          | Must provide total       |
| TanStack Query    | Optional                 | Recommended              |

---

## Row Selection

```typescript
import { type RowSelectionState } from "@tanstack/react-table";

const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
  },
  // ... other columns
];

const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
});

// Get selected rows
const selectedUsers = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
```

---

## Column Visibility

```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

const table = useReactTable({
  data,
  columns,
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
  getCoreRowModel: getCoreRowModel(),
});

// Toggle column visibility dropdown
{table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
  <DropdownMenuCheckboxItem
    key={col.id}
    checked={col.getIsVisible()}
    onCheckedChange={(value) => col.toggleVisibility(!!value)}
  >
    {col.id}
  </DropdownMenuCheckboxItem>
))}
```

---

## Composing a Full DataTable

```typescript
// components/data-table.tsx — Reusable generic table
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  pagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination && { getPaginationRowModel: getPaginationRowModel() }),
  });

  return (
    <div>
      {searchKey && (
        <Input
          placeholder={`Filter by ${searchKey}...`}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
          className="mb-4 max-w-sm"
        />
      )}
      {/* Table render */}
      {pagination && <DataTablePagination table={table} />}
    </div>
  );
}
```

---

## Anti-Patterns

| Anti-Pattern                             | Solution                                     |
| ---------------------------------------- | -------------------------------------------- |
| Building table logic from scratch        | Use TanStack Table row models                |
| Client-side pagination for large datasets| Use `manualPagination` with server queries   |
| Defining columns inside component        | Define `columns` outside or memoize          |
| Not providing `rowCount` for server-side | Always set `rowCount` from API total         |
| String-based column access               | Use typed `ColumnDef<T>` with `accessorKey`  |
| Custom sort/filter with client row models| Use `manualSorting`/`manualFiltering` instead|
| Ignoring empty state                     | Show "No results" when `rows.length === 0`   |
