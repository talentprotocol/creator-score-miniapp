# Overview
This folder includes prompts that should be copy/pasted into a docs/commands folder and then used by tagging them in the chat (e.g. @plan_feature.md) and providing additional context such as the description of your feature.

## Workflow
- New projects:
  - Define a product brief (business) - to reference regardless of feature
  - Embed tech guidance into .cursorrules
  - Use a starter kit
- Building features:
  - @plan_feature command
  - review the plan
  - Phases
  - @code_review command
  - Read through review
  - Select fixes to implement
  - Manually test
  - Confirm code & merge



# Example Use
## Create Brief
Used for establishing the bigger picture context of what this project is about which can be helpful to plan new features.
```
@create_brief.md 

We are building an application to help dungeon masters plan their D&D campaigns and it's going to be called Dragonroll. It will include a variety of different tools, such as a random map generator and bc generator, loot generator and so on. We will use ai and allow the dungeon master to input certain prompts or use the tools directly.
```

## Plan Feature
Used to create a technical plan for a new feature. Focuses on the technical requirements - NOT product manager context bloat or overly specific code details.
```
@plan_feature.md 

We want to add a new page that is going to be our NPC generator. To implement this, we are going to use the open ai api to generate the description of the npc as well as a name And we'll also generate an image for the npc using the open ai gpt-image-1 model.
```

## Code Review
Used to review the successful completion of a plan in a separate chat (and yes, it's this minimal)
```
@code_review.md
@0001_PLAN.md
```

## Documentation Writing
Used to create comprehensive documentation for the plan, review, and implementation.
```
@write_docs.md
@0001_PLAN.md
@0001_REVIEW.md
```