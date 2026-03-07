# TypeORM

## Entity Design

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

### Column Types

| Decorator | Use Case |
|-----------|----------|
| `@PrimaryGeneratedColumn('uuid')` | UUID primary keys |
| `@PrimaryGeneratedColumn('increment')` | Auto-increment integer keys |
| `@Column({ type: 'varchar', length: 255 })` | Variable-length strings |
| `@Column({ type: 'text' })` | Long text |
| `@Column({ type: 'jsonb' })` | JSON data (PostgreSQL) |
| `@Column({ type: 'enum', enum: Status })` | Enum columns |
| `@Column({ type: 'decimal', precision: 10, scale: 2 })` | Monetary values |
| `@CreateDateColumn()` | Auto-set on insert |
| `@UpdateDateColumn()` | Auto-set on update |
| `@DeleteDateColumn()` | Soft delete timestamp |

## Relations

```typescript
// One-to-Many / Many-to-One
@Entity()
export class Post {
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  authorId: string; // Expose FK for queries without joins
}

// Many-to-Many
@Entity()
export class Tag {
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}

@Entity()
export class Post {
  @ManyToMany(() => Tag, (tag) => tag.posts, { eager: false })
  @JoinTable({ name: 'post_tags' })
  tags: Tag[];
}

// One-to-One
@Entity()
export class Profile {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
```

### Relation Options

| Option | Purpose |
|--------|---------|
| `eager: true` | Always load relation (avoid for large datasets) |
| `cascade: true` | Auto-save/remove related entities |
| `onDelete: 'CASCADE'` | Delete children when parent is deleted |
| `onDelete: 'SET NULL'` | Nullify FK when parent is deleted |
| `nullable: false` | Require relation |

## Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findWithPosts(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: { posts: true },
    });
  }

  async findActive(page: number, limit: number): Promise<[User[], number]> {
    return this.repo.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
```

## QueryBuilder

Use QueryBuilder for complex queries that `find` options can't express.

```typescript
// Complex filtering with joins
const users = await this.repo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.isActive = :active', { active: true })
  .andWhere('post.publishedAt > :date', { date: startDate })
  .orderBy('user.createdAt', 'DESC')
  .skip(offset)
  .take(limit)
  .getMany();

// Subqueries
const users = await this.repo
  .createQueryBuilder('user')
  .where((qb) => {
    const subQuery = qb
      .subQuery()
      .select('post.authorId')
      .from(Post, 'post')
      .where('post.status = :status')
      .getQuery();
    return `user.id IN ${subQuery}`;
  })
  .setParameter('status', 'published')
  .getMany();

// Aggregation
const stats = await this.repo
  .createQueryBuilder('user')
  .select('user.role', 'role')
  .addSelect('COUNT(*)', 'count')
  .groupBy('user.role')
  .getRawMany();
```

## Migrations

```bash
# Generate migration from entity changes
npx typeorm migration:generate src/migrations/AddUserTable -d src/data-source.ts

# Create empty migration
npx typeorm migration:create src/migrations/SeedRoles

# Run pending migrations
npx typeorm migration:run -d src/data-source.ts

# Revert last migration
npx typeorm migration:revert -d src/data-source.ts
```

### Migration File

```typescript
export class AddUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "email" varchar(255) NOT NULL UNIQUE,
        "name" varchar(100) NOT NULL,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_email" ON "user" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_email"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
```

## DataSource Configuration

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Never true in production
  logging: process.env.NODE_ENV === 'development',
});
```

## Transactions

```typescript
// Using DataSource
async transferFunds(fromId: string, toId: string, amount: number) {
  await this.dataSource.transaction(async (manager) => {
    const from = await manager.findOneByOrFail(Account, { id: fromId });
    const to = await manager.findOneByOrFail(Account, { id: toId });

    from.balance -= amount;
    to.balance += amount;

    await manager.save([from, to]);
  });
}

// Using QueryRunner for fine-grained control
async complexOperation() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.manager.save(entity1);
    await queryRunner.manager.save(entity2);
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

## Subscribers

```typescript
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    event.entity.email = event.entity.email.toLowerCase();
  }

  afterLoad(entity: User) {
    // Transform after loading from DB
  }
}
```

## Indexes

```typescript
@Entity()
@Index(['email'], { unique: true })
@Index(['lastName', 'firstName']) // Composite index
export class User {
  @Index() // Single column index
  @Column()
  username: string;
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| `synchronize: true` in production | Drops columns/tables on schema change | Use migrations |
| `eager: true` on all relations | N+1 queries, loads entire graph | Load relations explicitly |
| Raw SQL without parameters | SQL injection risk | Use parameterized queries: `{ where: 'id = :id', parameters: { id } }` |
| Saving entire entity on update | Overwrites concurrent changes | Use `update()` or `QueryBuilder.update()` for partial updates |
| Missing `@Index` on FK columns | Slow JOIN queries | Add indexes on foreign key columns |
| `cascade: true` everywhere | Unintended deletes/saves | Use cascade only where parent owns children |
| Not using `findAndCount` for pagination | Extra query for total count | `findAndCount` returns `[items, total]` in one call |
| Ignoring `select` option | Fetching all columns | Use `select` to fetch only needed fields |
