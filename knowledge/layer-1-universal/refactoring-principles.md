# Refactoring Principles

## When to Refactor

| Do Refactor                    | Don't Refactor        |
| ------------------------------ | --------------------- |
| Rule of Three (3rd repetition) | During crunch time    |
| Before adding features         | Without tests         |
| After learning new patterns    | For its own sake      |
| When code smells present       | Without clear benefit |

---

## Strategies

| Strategy             | When                          |
| -------------------- | ----------------------------- |
| Extract Method       | Function > 30 lines           |
| Extract Component/Module | Component/Module > 300 lines |
| Parameter Object     | Parameters > 3-4              |
| Replace Conditionals | Many if/else chains           |
| Remove Dead Code     | Unused code exists            |

---

## Code Smells

| Smell                  | Indicator           | Action                 |
| ---------------------- | ------------------- | ---------------------- |
| Long Function          | > 30-50 lines       | Extract methods        |
| Large Component/Module | > 300-500 lines     | Split responsibilities |
| Duplicated Code        | Same code 3+ places | Extract function       |
| Long Parameter List    | > 3-4 params        | Use object             |
| Dead Code              | Unused functions    | Delete immediately     |

---

## Safety Checklist

### Before

- [ ] Tests in place
- [ ] Current state committed
- [ ] Understand behavior

### During

- [ ] One change at a time
- [ ] Run tests frequently
- [ ] Commit after each success

### After

- [ ] All tests pass
- [ ] No behavior changes
- [ ] Code more maintainable

---

## Principles

- **Rule of Three**: Abstract on 3rd repetition
- **Small Steps**: Incremental improvements
- **Safety First**: Tests before refactoring
- **Behavior Preservation**: Don't change functionality
- **Clear Benefit**: Must improve maintainability
