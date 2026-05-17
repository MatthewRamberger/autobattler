# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Always open a NEW PR to `main` for each task

After pushing a feature branch, **always** open a pull request targeting
`main` so the user can review and merge. Don't wait to be asked. Use the
`mcp__github__create_pull_request` tool (this repo has no `gh` CLI).
Return the PR URL in the reply so the user can click through.

**Each new task or feedback round = NEW branch + NEW PR.** Do NOT push
follow-up commits to a previously-opened branch and reuse the old PR —
the user has explicitly said that's wrong. When the user gives a fresh
request, even if it builds on prior work:

1. Create a new branch off the current HEAD (e.g.
   `claude/<short-task-name>-<suffix>`).
2. Commit the new work to that branch.
3. Push it as a new branch (`git push -u origin <branch>`).
4. Open a fresh PR targeting `main` for that branch.
5. Reply with the new PR URL — never an old one.
