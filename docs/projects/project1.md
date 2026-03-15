# Legacy SQL to AWS Glue Migration via Agentic AI

> Cut migration time by 60-70% using an AI-assisted workflow to refactor legacy SQL reporting jobs into Python on AWS Glue.

## The Problem

BMW Financial Services ran dozens of legacy SQL reporting jobs that needed migrating to AWS Glue (Python) as part of a cloud platform transition. The migration was complicated by structural changes to backend database tables, meaning each job required both language translation and schema remapping. Traditional manual migration typically took several days to weeks per job.

## What I Did

- **Designed an agentic AI workflow** that automated the bulk of the translation work, feeding comprehensive "new-to-old" database mapping as structured context to GitHub Copilot.
- **Led the internal engineering initiative** end-to-end: scoping the approach, building the mapping documentation, testing outputs, and iterating on prompt quality.
- **Validated migrated jobs** against source outputs to ensure accuracy and completeness before production deployment.
- **Documented the process** so the approach could be replicated across future migration waves.

## Tech Stack

`GitHub Copilot` · `SQL` · `Python` · `AWS Glue` · `Context Engineering`

## Results

- **60-70% reduction in development and migration time** per job, turning weeks of manual refactoring into days.
- Accelerated delivery of critical reporting infrastructure during the cloud platform transition.
- Demonstrated a repeatable pattern for using AI-assisted workflows in regulated enterprise environments.
