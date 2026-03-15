---
name: work-issues
description: Start working on tasks from the IssueFoundry kanban board. Fetches the board, picks the next task, and begins implementation.
argument-hint: "[card-id]"
---

# Work on Issues

You are picking up tasks from the IssueFoundry kanban board and working on them.

## Workflow

1. **Fetch the board** using `get_board` to see all columns and cards
2. **Pick the next task**: If `$ARGUMENTS` contains a card ID, work on that specific card. Otherwise, pick the highest-priority card from "To Do". Priority = lowest position number (top of column). Never pick tasks from "Backlog" — those are not ready for work.
3. **Read the card** using `get_card` to see full description and comments
4. **Assess the task**:
   - If the task is clear enough to start: move it to "In Progress" and add a comment explaining your plan
   - If the task is unclear or ambiguous: add a comment asking for clarification, do NOT move it to "In Progress", and move on to the next task
5. **Only one card in "In Progress"**: If there's already a card in "In Progress", finish that one first before picking up new work
6. **Do the work**: Implement the changes described in the card
7. **When done**: Add a comment summarizing what was done, then move the card to "Review". Never move cards to "Done" — the user will do that themselves.
8. **Pick up the next task** if there are more cards in "To Do"

## Rules

- Always add a comment before starting work (your plan) and after completing it (what was done)
- If you don't understand a task, comment asking for clarification instead of guessing
- Only keep ONE card in "In Progress" at a time
- Build and restart the server after code changes when applicable
- Test your changes when possible
- If your changes affect documented features (e.g. new tools, changed APIs, new UI features), update the relevant documentation (README.md, etc.) as part of the task
