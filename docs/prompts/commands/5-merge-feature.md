# Merge Feature

After feature implementation and code review are complete:

1. **QA Testing**: Generate and execute a testing checklist focused on core functionality. Run all available automated tests. Only ask user to test what cannot be executed by an agent.
1. **Commit & Push**: Commit all unstaged changes and push to current branch, using GitHub CLI commands.
2. **Version Management**: Bump version if needed (see .cursor/rules/versioning.mdc). Recommend a type of bump (minor or patch) but ask for user to confirm.
3. **Changelog Verification**: Verify Notion changelog entry was created, trigger if not (see .cursor/rules/changelog.mdc)
4. **Create PR**: Create pull request with implementation details for internal review.
5. **Write Docs**: After the PR is merged, check if the Notion changelog needs update and ask the user to use the docs/prompts/commands/write_docs.md prompt.

Document your findings in docs/features/<N>_MERGE.md unless a different file name is specified.