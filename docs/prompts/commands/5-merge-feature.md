# Merge Feature

After feature implementation and code review are complete:

1. **QA Testing**: Generate and execute a testing checklist focused on core functionality. Run all available automated tests. Only ask user to test what cannot be executed by an agent.
1. **Commit & Push**: Commit all unstaged changes and push to current branch, using GitHub CLI commands.
2. **Version Management**: Bump version if needed (see .cursor/rules/versioning.mdc). Recommend a type of bump (minor or patch) but ask for user to confirm.
3. **Changelog Verification**: Verify Notion changelog entry was created, trigger if not (see .cursor/rules/changelog.mdc)
4. **Create PR**: Create pull request (using GitHub CLI) with both a brief feature description (write for users) and implementation details for technical internal review.
5. **Write Docs**: After the PR is merged, check if the Notion changelog needs update and ask the user to use the docs/prompts/commands/write_docs.md prompt.
6. **Linear Issue**: Update the Linear issue (ask user for the URL if needed) with a brief summary of what was implemented and add links to the GitHub PR and Notion changelog entry.

Document your findings in docs/features/<N>_MERGE.md unless a different file name is specified.